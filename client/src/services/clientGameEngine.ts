import {
  Question,
  QuizQuestion,
  HostDashboardState,
  PlayerGameState,
  GameStatus,
  HostLivePlayerRow,
} from '../types';
import { calculateSubmissionScore, calculateQuizScore } from './scoring';
import Peer, { DataConnection } from 'peerjs';

const ROOMS_STORAGE_KEY = 'aifc_multiplayer_active_rooms';

interface LocalPlayer {
  id: string;
  name: string;
  sessionToken: string;
  socketId: string;
  isConnected: boolean;
  totalScore: number;
  joinedAt: number;
  roundSubmitted: boolean;
  roundAnswers?: Record<string, string>;
  quizSubmitted?: boolean;
  quizSelectedOption?: string;
  lastRoundScore?: number;
  lastQuizScore?: number;
}

interface LocalRoom {
  roomCode: string;
  title: string;
  hostToken: string;
  hostSocketId: string;
  status: GameStatus;
  questions: Question[];
  currentRoundIndex: number;
  quizQuestions: QuizQuestion[];
  currentQuizIndex: number;
  timeRemainingSeconds: number;
  isPaused: boolean;
  revealLeaderboard: boolean;
  defaultTimeLimitSeconds: number;
  players: Record<string, LocalPlayer>;
  timerInterval?: any;
}

class ClientGameEngine {
  private rooms: Map<string, LocalRoom> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private peer: Peer | null = null;
  private peerConnections: Map<string, DataConnection> = new Map();
  private playerConnectionToHost: DataConnection | null = null;

  constructor() {
    this.loadRoomsFromStorage();

    if (typeof window !== 'undefined') {
      if ('BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('aifc_multiplayer_channel');
        this.broadcastChannel.onmessage = (event) => {
          const { eventName, payload } = event.data || {};
          if (eventName) {
            if (eventName === 'room:sync') {
              this.loadRoomsFromStorage();
            }
            this.triggerLocal(eventName, payload);
          }
        };
      }

      window.addEventListener('storage', (e) => {
        if (e.key === ROOMS_STORAGE_KEY) {
          this.loadRoomsFromStorage();
        }
      });
    }
  }

  private loadRoomsFromStorage() {
    try {
      const stored = localStorage.getItem(ROOMS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'object' && parsed !== null) {
          Object.keys(parsed).forEach((code) => {
            const r = parsed[code];
            if (!this.rooms.has(code)) {
              this.rooms.set(code, r);
            } else {
              // Update players from storage
              const existing = this.rooms.get(code)!;
              existing.players = { ...existing.players, ...r.players };
              existing.status = r.status;
              existing.currentRoundIndex = r.currentRoundIndex;
              existing.currentQuizIndex = r.currentQuizIndex;
              existing.timeRemainingSeconds = r.timeRemainingSeconds;
              existing.revealLeaderboard = r.revealLeaderboard;
            }
          });
        }
      }
    } catch (e) {
      console.warn('Error loading rooms from storage:', e);
    }
  }

  private persistRooms() {
    try {
      const plainObj: Record<string, any> = {};
      this.rooms.forEach((room, code) => {
        const { timerInterval, ...serializable } = room;
        plainObj[code] = serializable;
      });
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(plainObj));
    } catch (e) {
      console.warn('Error saving rooms to storage:', e);
    }
  }

  private broadcast(eventName: string, payload: any) {
    this.triggerLocal(eventName, payload);
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ eventName, payload });
      } catch (e) {
        // broadcast error ignored
      }
    }

    // Also send over WebRTC P2P to connected players
    this.peerConnections.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send({ eventName, payload });
        } catch (e) {}
      }
    });
  }

  public on(eventName: string, fn: Function) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }
    this.eventListeners.get(eventName)!.add(fn);
  }

  public off(eventName: string, fn?: Function) {
    if (!fn) {
      this.eventListeners.delete(eventName);
    } else {
      this.eventListeners.get(eventName)?.delete(fn);
    }
  }

  private triggerLocal(eventName: string, payload: any) {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach((fn) => {
        try {
          fn(payload);
        } catch (e) {
          console.error(e);
        }
      });
    }
  }

  public createRoom(
    title: string,
    questions: Question[],
    quizQuestions: QuizQuestion[],
    defaultTimeLimit: number = 35
  ): { roomCode: string; hostToken: string } {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let roomCode = '';
    for (let i = 0; i < 6; i++) {
      roomCode += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    const hostToken = 'host_' + Math.random().toString(36).substring(2, 12);

    const room: LocalRoom = {
      roomCode,
      title: title || 'AIFC Multiplayer Game',
      hostToken,
      hostSocketId: 'host_local',
      status: 'WAITING',
      questions,
      currentRoundIndex: 0,
      quizQuestions,
      currentQuizIndex: 0,
      timeRemainingSeconds: defaultTimeLimit,
      isPaused: false,
      revealLeaderboard: false,
      defaultTimeLimitSeconds: defaultTimeLimit,
      players: {},
    };

    this.rooms.set(roomCode, room);
    this.persistRooms();

    // Broadcast room creation
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ eventName: 'room:sync' });
      } catch (e) {}
    }

    // Initialize Host WebRTC Peer
    this.initHostPeer(roomCode);

    return { roomCode, hostToken };
  }

  private initHostPeer(roomCode: string) {
    try {
      if (this.peer) {
        this.peer.destroy();
      }

      const peerId = `aifc_host_${roomCode.toLowerCase()}`;
      this.peer = new Peer(peerId, {
        debug: 0,
      });

      this.peer.on('connection', (conn) => {
        this.peerConnections.set(conn.peer, conn);

        conn.on('data', (msg: any) => {
          const { eventName, data, callbackId } = msg || {};
          if (eventName === 'player:join') {
            const res = this.addPlayer(data.roomCode, data.playerName);
            conn.send({ callbackId, response: res });
          } else if (eventName === 'player:submit_round') {
            this.submitRound(data.roomCode, data.playerId, data.answers, data.completionTimeMs || 0);
            conn.send({ callbackId, response: { success: true } });
          } else if (eventName === 'player:submit_quiz') {
            this.submitQuiz(data.roomCode, data.playerId, data.selectedOption, data.completionTimeMs || 0);
            conn.send({ callbackId, response: { success: true } });
          }
        });

        conn.on('close', () => {
          this.peerConnections.delete(conn.peer);
        });
      });
    } catch (err) {
      console.warn('PeerJS Host initialization error:', err);
    }
  }

  public registerHost(roomCode: string, hostToken: string): { success: boolean; state?: HostDashboardState } {
    const cleanCode = roomCode.trim().toUpperCase();
    this.loadRoomsFromStorage();
    const room = this.rooms.get(cleanCode);
    if (!room || room.hostToken !== hostToken) {
      return { success: false };
    }
    return { success: true, state: this.getHostState(room) };
  }

  public addPlayer(
    roomCode: string,
    playerName: string
  ): { success: boolean; player?: any; sessionToken?: string; players?: any[]; error?: string } {
    const cleanCode = (roomCode || '').trim().toUpperCase();
    this.loadRoomsFromStorage();

    let room = this.rooms.get(cleanCode);

    // If room not found directly, check if any room is stored in localStorage
    if (!room && this.rooms.size > 0) {
      // Find case-insensitive match
      for (const [code, r] of this.rooms.entries()) {
        if (code.toUpperCase() === cleanCode) {
          room = r;
          break;
        }
      }
    }

    // If still not found and there is only 1 active room, fallback to that room
    if (!room && this.rooms.size === 1) {
      room = Array.from(this.rooms.values())[0];
    }

    if (!room) {
      return { success: false, error: 'Game room not found. Please verify the 6-character Room Code.' };
    }

    const playerId = 'p_' + Math.random().toString(36).substring(2, 9);
    const sessionToken = 'tok_' + Math.random().toString(36).substring(2, 12);

    const player: LocalPlayer = {
      id: playerId,
      name: playerName.trim() || 'Player',
      sessionToken,
      socketId: playerId,
      isConnected: true,
      totalScore: 0,
      joinedAt: Date.now(),
      roundSubmitted: false,
    };

    room.players[playerId] = player;
    this.persistRooms();

    const playersList = Object.values(room.players).map((p) => ({
      id: p.id,
      name: p.name,
      isConnected: p.isConnected,
    }));

    this.broadcast('player:list_updated', { players: playersList });
    this.broadcast('host:state_update', this.getHostState(room));

    // Also send initial player state
    setTimeout(() => {
      this.triggerLocal('player:state_update', this.getPlayerState(room!, playerId));
    }, 50);

    return {
      success: true,
      player,
      sessionToken,
      players: playersList,
    };
  }

  public startGame(roomCode: string) {
    const cleanCode = roomCode.trim().toUpperCase();
    const room = this.rooms.get(cleanCode);
    if (!room) return;

    room.status = 'STARTING';
    this.persistRooms();
    this.broadcast('host:state_update', this.getHostState(room));

    let count = 3;
    this.broadcast('game:starting_countdown', { countdown: count });

    const cdInterval = setInterval(() => {
      count--;
      if (count > 0) {
        this.broadcast('game:starting_countdown', { countdown: count });
      } else {
        clearInterval(cdInterval);
        room.status = 'PLAYING';
        room.currentRoundIndex = 0;
        room.timeRemainingSeconds = room.questions[0]?.timeLimitSeconds || room.defaultTimeLimitSeconds;
        this.persistRooms();
        this.startTimer(room);
        this.broadcastUpdates(room);
      }
    }, 1000);
  }

  public nextRound(roomCode: string) {
    const cleanCode = roomCode.trim().toUpperCase();
    const room = this.rooms.get(cleanCode);
    if (!room) return;

    if (room.currentRoundIndex + 1 < room.questions.length) {
      room.currentRoundIndex++;
      room.status = 'PLAYING';
      room.revealLeaderboard = false;
      Object.values(room.players).forEach((p) => {
        p.roundSubmitted = false;
        p.roundAnswers = undefined;
      });
      room.timeRemainingSeconds = room.questions[room.currentRoundIndex]?.timeLimitSeconds || room.defaultTimeLimitSeconds;
      this.persistRooms();
      this.startTimer(room);
      this.broadcastUpdates(room);
    } else {
      this.completeGame(roomCode);
    }
  }

  public startQuiz(roomCode: string) {
    const cleanCode = roomCode.trim().toUpperCase();
    const room = this.rooms.get(cleanCode);
    if (!room) return;

    room.status = 'QUIZ_PLAYING';
    room.currentQuizIndex = 0;
    room.revealLeaderboard = false;
    Object.values(room.players).forEach((p) => {
      p.quizSubmitted = false;
      p.quizSelectedOption = undefined;
    });

    const currentQuizQ = room.quizQuestions[0];
    room.timeRemainingSeconds = currentQuizQ?.timeLimitSeconds || 25;
    this.persistRooms();
    this.startTimer(room);
    this.broadcastUpdates(room);
  }

  public nextQuiz(roomCode: string) {
    const cleanCode = roomCode.trim().toUpperCase();
    const room = this.rooms.get(cleanCode);
    if (!room) return;

    if (room.currentQuizIndex + 1 < room.quizQuestions.length) {
      room.currentQuizIndex++;
      room.status = 'QUIZ_PLAYING';
      room.revealLeaderboard = false;
      Object.values(room.players).forEach((p) => {
        p.quizSubmitted = false;
        p.quizSelectedOption = undefined;
      });
      const q = room.quizQuestions[room.currentQuizIndex];
      room.timeRemainingSeconds = q?.timeLimitSeconds || 25;
      this.persistRooms();
      this.startTimer(room);
      this.broadcastUpdates(room);
    } else {
      room.status = 'QUIZ_COMPLETED';
      room.revealLeaderboard = true;
      if (room.timerInterval) clearInterval(room.timerInterval);
      this.persistRooms();
      this.broadcastUpdates(room);
    }
  }

  public submitRound(roomCode: string, playerId: string, answers: Record<string, string>, completionTimeMs: number) {
    const cleanCode = roomCode.trim().toUpperCase();
    const room = this.rooms.get(cleanCode);
    if (!room || room.status !== 'PLAYING') return;

    const player = room.players[playerId];
    if (!player || player.roundSubmitted) return;

    player.roundSubmitted = true;
    player.roundAnswers = answers;

    const currentQ = room.questions[room.currentRoundIndex];
    if (currentQ) {
      const scoreResult = calculateSubmissionScore(currentQ, answers, completionTimeMs);
      player.lastRoundScore = scoreResult.scoreAwarded;
      player.totalScore += scoreResult.scoreAwarded;
    }

    this.persistRooms();
    this.broadcastUpdates(room);
  }

  public submitQuiz(roomCode: string, playerId: string, selectedOption: string, completionTimeMs: number) {
    const cleanCode = roomCode.trim().toUpperCase();
    const room = this.rooms.get(cleanCode);
    if (!room || room.status !== 'QUIZ_PLAYING') return;

    const player = room.players[playerId];
    if (!player || player.quizSubmitted) return;

    player.quizSubmitted = true;
    player.quizSelectedOption = selectedOption;

    const currentQQ = room.quizQuestions[room.currentQuizIndex];
    if (currentQQ) {
      const result = calculateQuizScore(currentQQ, selectedOption, completionTimeMs);
      player.lastQuizScore = result.scoreAwarded;
      player.totalScore += result.scoreAwarded;
    }

    this.persistRooms();
    this.broadcastUpdates(room);
  }

  public setRevealLeaderboard(roomCode: string, reveal: boolean) {
    const cleanCode = roomCode.trim().toUpperCase();
    const room = this.rooms.get(cleanCode);
    if (!room) return;
    room.revealLeaderboard = reveal;
    this.persistRooms();
    this.broadcastUpdates(room);
  }

  public completeGame(roomCode: string) {
    const cleanCode = roomCode.trim().toUpperCase();
    const room = this.rooms.get(cleanCode);
    if (!room) return;
    room.status = 'GAME_COMPLETED';
    room.revealLeaderboard = true;
    if (room.timerInterval) clearInterval(room.timerInterval);
    this.persistRooms();
    this.broadcastUpdates(room);
  }

  private startTimer(room: LocalRoom) {
    if (room.timerInterval) clearInterval(room.timerInterval);
    room.timerInterval = setInterval(() => {
      if (room.isPaused) return;
      if (room.timeRemainingSeconds > 0) {
        room.timeRemainingSeconds--;
        this.broadcast('game:timer_tick', { timeRemainingSeconds: room.timeRemainingSeconds });
      } else {
        clearInterval(room.timerInterval);
        if (room.status === 'PLAYING') {
          room.status = 'ROUND_COMPLETED';
        } else if (room.status === 'QUIZ_PLAYING') {
          room.status = 'QUIZ_ROUND_COMPLETED';
        }
        this.persistRooms();
        this.broadcastUpdates(room);
      }
    }, 1000);
  }

  private broadcastUpdates(room: LocalRoom) {
    this.broadcast('host:state_update', this.getHostState(room));
    Object.keys(room.players).forEach((pId) => {
      this.broadcast('player:state_update', this.getPlayerState(room, pId));
    });
  }

  public getHostState(room: LocalRoom): HostDashboardState {
    const sorted = Object.values(room.players).sort((a, b) => b.totalScore - a.totalScore);
    const livePlayers: HostLivePlayerRow[] = sorted.map((p, idx) => ({
      rank: idx + 1,
      playerId: p.id,
      playerName: p.name,
      isConnected: p.isConnected,
      status: p.roundSubmitted || p.quizSubmitted ? 'submitted' : 'thinking',
      correctCount: 0,
      wrongCount: 0,
      completionTimeMs: null,
      roundScore: p.lastRoundScore || 0,
      totalScore: p.totalScore,
      selectedOption: p.quizSelectedOption,
    }));

    return {
      roomCode: room.roomCode,
      title: room.title,
      status: room.status,
      currentRoundIndex: room.currentRoundIndex,
      totalRounds: room.questions.length,
      currentQuestion: room.questions[room.currentRoundIndex] || null,
      timeRemainingSeconds: room.timeRemainingSeconds,
      isPaused: room.isPaused,
      connectedPlayersCount: Object.keys(room.players).length,
      revealLeaderboard: room.revealLeaderboard,
      livePlayers,
      quizQuestions: room.quizQuestions,
      currentQuizIndex: room.currentQuizIndex,
      currentQuizQuestionIndex: room.currentQuizIndex,
      totalQuizQuestions: room.quizQuestions.length,
      currentQuizQuestion: room.quizQuestions[room.currentQuizIndex] || null,
    };
  }

  public getPlayerState(room: LocalRoom, playerId: string): PlayerGameState {
    const player = room.players[playerId];
    const currentQ = room.questions[room.currentRoundIndex];
    const currentQQ = room.quizQuestions[room.currentQuizIndex];

    const sorted = Object.values(room.players).sort((a, b) => b.totalScore - a.totalScore);
    const rank = sorted.findIndex((p) => p.id === playerId) + 1;

    const publicQ = currentQ
      ? {
          id: currentQ.id,
          title: currentQ.title,
          timeLimitSeconds: currentQ.timeLimitSeconds || 35,
          categories: currentQ.categories,
          items: currentQ.items.map((it) => ({ id: it.id, name: it.name, imageUrl: it.imageUrl })),
        }
      : null;

    const publicQQ = currentQQ
      ? {
          id: currentQQ.id,
          imageUrl: currentQQ.imageUrl,
          questionText: currentQQ.text || currentQQ.questionText,
          text: currentQQ.text || currentQQ.questionText,
          options: currentQQ.options,
          timeLimitSeconds: currentQQ.timeLimitSeconds || 25,
        }
      : null;

    const finalLeaderboard = sorted.map((p, idx) => ({
      rank: idx + 1,
      name: p.name,
      score: p.totalScore,
      accuracyPercent: 100,
    }));

    return {
      roomCode: room.roomCode,
      playerName: player?.name || 'Player',
      status: room.status,
      currentRoundIndex: room.currentRoundIndex,
      totalRounds: room.questions.length,
      currentQuestion: publicQ,
      timeRemainingSeconds: room.timeRemainingSeconds,
      isPaused: room.isPaused,
      playerScore: player?.totalScore || 0,
      playerRoundSubmitted: Boolean(player?.roundSubmitted),
      currentQuizIndex: room.currentQuizIndex,
      currentQuizQuestionIndex: room.currentQuizIndex,
      totalQuizQuestions: room.quizQuestions.length,
      currentQuizQuestion: publicQQ,
      playerQuizSubmitted: Boolean(player?.quizSubmitted),
      playerSelectedOption: player?.quizSelectedOption,
      connectedPlayers: Object.values(room.players).map((p) => ({ id: p.id, name: p.name, isConnected: p.isConnected })),
      finalLeaderboard: room.revealLeaderboard ? finalLeaderboard : undefined,
      finalStats: {
        totalScore: player?.totalScore || 0,
        totalCorrect: 0,
        totalWrong: 0,
        totalTimeSeconds: 0,
        accuracyPercent: 100,
        rank: rank || 1,
      },
    };
  }
}

export const clientGameEngine = new ClientGameEngine();
