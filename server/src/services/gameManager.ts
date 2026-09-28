import { v4 as uuidv4 } from 'uuid';
import {
  GameRoom,
  GameStatus,
  Player,
  Question,
  QuestionPublic,
  QuizQuestion,
  QuizQuestionPublic,
  QuizSubmission,
  PlayerSubmission,
  HostDashboardState,
  HostLivePlayerRow,
  PlayerGameState,
  PlayerRoundStatus,
} from '../types/index.js';
import { db } from '../db/database.js';
import { calculateSubmissionScore, calculateQuizScore } from './scoring.js';

// Clean character set for readable room codes (excluding 0, O, 1, I)
const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
}

export class GameManager {
  private activeRooms: Map<string, GameRoom> = new Map();
  private roomTimers: Map<string, NodeJS.Timeout> = new Map();
  private roomIntervals: Map<string, NodeJS.Timeout> = new Map();
  private io: any = null;

  public setSocketServer(io: any) {
    this.io = io;
  }

  public createRoom(
    title: string,
    questions: Question[],
    defaultTimeLimitSeconds = 30
  ): { room: GameRoom; hostToken: string } {
    let roomCode = generateRoomCode();
    // Ensure uniqueness
    while (this.activeRooms.has(roomCode) || db.getGame(roomCode)) {
      roomCode = generateRoomCode();
    }

    const hostToken = uuidv4();
    const room: GameRoom = {
      id: uuidv4(),
      roomCode,
      title: title || 'Speed Categorization Challenge',
      hostSocketId: '',
      hostToken,
      defaultTimeLimitSeconds,
      status: 'WAITING',
      currentRoundIndex: 0,
      roundStartTime: null,
      roundDurationSeconds: defaultTimeLimitSeconds,
      isPaused: false,
      pausedRemainingSeconds: null,
      revealLeaderboard: false,
      questions: questions.length > 0 ? questions : db.getQuestionTemplates(),
      quizQuestions: db.getQuizQuestionTemplates(),
      currentQuizIndex: 0,
      quizSubmissions: {},
      players: {},
      submissions: {},
      createdAt: Date.now(),
    };

    this.activeRooms.set(roomCode, room);
    db.saveGame(room);

    return { room, hostToken };
  }

  public getRoom(roomCode: string): GameRoom | undefined {
    const upperCode = roomCode.toUpperCase();
    if (!this.activeRooms.has(upperCode)) {
      const persisted = db.getGame(upperCode);
      if (persisted) {
        this.activeRooms.set(upperCode, persisted);
      }
    }
    return this.activeRooms.get(upperCode);
  }

  public registerHostSocket(roomCode: string, socketId: string, hostToken: string): boolean {
    const room = this.getRoom(roomCode);
    if (!room) return false;
    if (room.hostToken === hostToken) {
      room.hostSocketId = socketId;
      this.broadcastHostState(room.roomCode);
      return true;
    }
    return false;
  }

  public addPlayer(roomCode: string, playerName: string, socketId: string): { player: Player; sessionToken: string } | null {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    // Check if player with same name already existed in room (reconnection or existing)
    const existingPlayer = Object.values(room.players).find(
      (p) => p.name.trim().toLowerCase() === playerName.trim().toLowerCase()
    );

    if (existingPlayer) {
      existingPlayer.socketId = socketId;
      existingPlayer.isConnected = true;
      db.saveGame(room);
      this.broadcastHostState(room.roomCode);
      this.broadcastPlayerStates(room.roomCode);
      this.broadcastToRoom(room.roomCode, 'player:joined_room', {
        players: Object.values(room.players).map((p) => ({ id: p.id, name: p.name, isConnected: p.isConnected })),
      });
      return { player: existingPlayer, sessionToken: existingPlayer.sessionToken };
    }

    const playerId = uuidv4();
    const sessionToken = uuidv4();
    const player: Player = {
      id: playerId,
      roomCode: room.roomCode,
      name: playerName.trim(),
      sessionToken,
      socketId,
      isConnected: true,
      totalScore: 0,
      joinedAt: Date.now(),
    };

    room.players[playerId] = player;
    db.saveGame(room);

    this.broadcastHostState(room.roomCode);
    this.broadcastPlayerStates(room.roomCode);
    this.broadcastToRoom(room.roomCode, 'player:joined_room', {
      players: Object.values(room.players).map((p) => ({ id: p.id, name: p.name, isConnected: p.isConnected })),
    });
    this.broadcastToRoom(room.roomCode, 'player:list_updated', {
      players: Object.values(room.players).map((p) => ({ id: p.id, name: p.name, isConnected: p.isConnected })),
    });

    return { player, sessionToken };
  }

  public reconnectPlayer(roomCode: string, sessionToken: string, socketId: string): Player | null {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    const player = Object.values(room.players).find((p) => p.sessionToken === sessionToken);
    if (!player) return null;

    player.socketId = socketId;
    player.isConnected = true;
    db.saveGame(room);

    this.broadcastHostState(room.roomCode);
    this.broadcastPlayerStates(room.roomCode);
    this.broadcastToRoom(room.roomCode, 'player:list_updated', {
      players: Object.values(room.players).map((p) => ({ id: p.id, name: p.name, isConnected: p.isConnected })),
    });
    return player;
  }

  public handleDisconnect(socketId: string) {
    for (const room of this.activeRooms.values()) {
      if (room.hostSocketId === socketId) {
        room.hostSocketId = '';
        continue;
      }
      for (const player of Object.values(room.players)) {
        if (player.socketId === socketId) {
          player.isConnected = false;
          db.saveGame(room);
          this.broadcastHostState(room.roomCode);
          this.broadcastPlayerStates(room.roomCode);
          this.broadcastToRoom(room.roomCode, 'player:list_updated', {
            players: Object.values(room.players).map((p) => ({ id: p.id, name: p.name, isConnected: p.isConnected })),
          });
          break;
        }
      }
    }
  }

  // CATEGORIZATION GAME CONTROLS
  public startGame(roomCode: string): boolean {
    const room = this.getRoom(roomCode);
    if (!room || (room.status !== 'WAITING' && room.status !== 'GAME_COMPLETED')) return false;

    room.currentRoundIndex = 0;
    room.status = 'STARTING';
    room.submissions = {};
    for (const p of Object.values(room.players)) {
      p.totalScore = 0;
    }
    db.saveGame(room);

    this.broadcastHostState(room.roomCode);
    this.broadcastPlayerStates(room.roomCode);

    // 3 second synchronized countdown
    let countdown = 3;
    this.broadcastToRoom(room.roomCode, 'game:starting_countdown', { countdown });

    const interval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        this.broadcastToRoom(room.roomCode, 'game:starting_countdown', { countdown });
      } else {
        clearInterval(interval);
        this.broadcastToRoom(room.roomCode, 'game:starting_countdown', { countdown: 0 });
        this.beginRound(room.roomCode, 0);
      }
    }, 1000);

    return true;
  }

  public beginRound(roomCode: string, roundIndex: number) {
    const room = this.getRoom(roomCode);
    if (!room) return;

    if (roundIndex >= room.questions.length) {
      this.completeGame(roomCode);
      return;
    }

    const question = room.questions[roundIndex];
    const durationSeconds = question.timeLimitSeconds || room.defaultTimeLimitSeconds || 30;

    room.status = 'PLAYING';
    room.currentRoundIndex = roundIndex;
    room.roundStartTime = Date.now();
    room.roundDurationSeconds = durationSeconds;
    room.isPaused = false;
    room.pausedRemainingSeconds = null;

    if (!room.submissions[roundIndex]) {
      room.submissions[roundIndex] = {};
    }

    db.saveGame(room);

    this.clearRoomTimer(room.roomCode);

    this.broadcastToRoom(room.roomCode, 'game:timer_tick', {
      timeRemainingSeconds: durationSeconds,
    });

    this.startRoomInterval(room.roomCode);

    this.broadcastHostState(room.roomCode);
    this.broadcastPlayerStates(room.roomCode);
  }

  public pauseGame(roomCode: string): boolean {
    const room = this.getRoom(roomCode);
    const isCategorizing = room?.status === 'PLAYING';
    const isQuiz = room?.status === 'QUIZ_PLAYING';
    if (!room || (!isCategorizing && !isQuiz) || room.isPaused) return false;

    this.clearRoomTimer(roomCode);
    const elapsed = (Date.now() - (room.roundStartTime || Date.now())) / 1000;
    const remaining = Math.max(0, room.roundDurationSeconds - elapsed);

    room.isPaused = true;
    room.pausedRemainingSeconds = remaining;
    db.saveGame(room);

    this.broadcastHostState(room.roomCode);
    this.broadcastPlayerStates(room.roomCode);
    return true;
  }

  public resumeGame(roomCode: string): boolean {
    const room = this.getRoom(roomCode);
    const isCategorizing = room?.status === 'PLAYING';
    const isQuiz = room?.status === 'QUIZ_PLAYING';
    if (!room || (!isCategorizing && !isQuiz) || !room.isPaused) return false;

    const remaining = Math.max(1, Math.round(room.pausedRemainingSeconds || 10));
    room.isPaused = false;
    room.roundStartTime = Date.now() - (room.roundDurationSeconds - remaining) * 1000;
    room.pausedRemainingSeconds = null;
    db.saveGame(room);

    this.broadcastToRoom(room.roomCode, 'game:timer_tick', {
      timeRemainingSeconds: remaining,
    });

    this.startRoomInterval(room.roomCode);

    this.broadcastHostState(room.roomCode);
    this.broadcastPlayerStates(room.roomCode);
    return true;
  }

  public submitPlayerAnswers(
    roomCode: string,
    playerId: string,
    answers: Record<string, string>
  ): PlayerSubmission | null {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    const isPlaying = room.status === 'PLAYING';
    const isGracePeriod = room.status === 'ROUND_COMPLETED';
    if (!isPlaying && !isGracePeriod) return null;

    const player = room.players[playerId];
    if (!player) return null;

    const roundIndex = room.currentRoundIndex;
    const question = room.questions[roundIndex];
    if (!question) return null;

    const existingSub = room.submissions[roundIndex]?.[playerId];
    if (existingSub && Object.keys(existingSub.answers).length > 0) {
      return existingSub;
    }

    const roundStartTime = room.roundStartTime || Date.now();
    const completionTimeMs = Math.max(100, Date.now() - roundStartTime);

    const scoreResult = calculateSubmissionScore(question, answers, completionTimeMs);

    const submission: PlayerSubmission = {
      playerId,
      roundIndex,
      answers,
      completionTimeMs,
      correctCount: scoreResult.correctCount,
      wrongCount: scoreResult.wrongCount,
      scoreAwarded: scoreResult.scoreAwarded,
      submittedAt: Date.now(),
    };

    if (!room.submissions[roundIndex]) {
      room.submissions[roundIndex] = {};
    }

    if (existingSub) {
      player.totalScore -= existingSub.scoreAwarded;
    }
    room.submissions[roundIndex][playerId] = submission;
    player.totalScore += scoreResult.scoreAwarded;

    db.saveGame(room);

    this.broadcastHostState(room.roomCode);
    this.broadcastPlayerState(room.roomCode, playerId);

    if (room.status === 'PLAYING') {
      const connectedPlayers = Object.values(room.players).filter((p) => p.isConnected);
      const roundSubmissions = Object.keys(room.submissions[roundIndex] || {});
      const allSubmitted =
        connectedPlayers.length > 0 &&
        connectedPlayers.every((p) => roundSubmissions.includes(p.id));

      if (allSubmitted) {
        this.finishRound(room.roomCode);
      }
    }

    return submission;
  }

  public finishRound(roomCode: string) {
    const room = this.getRoom(roomCode);
    if (!room || room.status !== 'PLAYING') return;

    this.clearRoomTimer(roomCode);
    room.status = 'ROUND_COMPLETED';

    const roundIndex = room.currentRoundIndex;
    const question = room.questions[roundIndex];

    if (question) {
      if (!room.submissions[roundIndex]) {
        room.submissions[roundIndex] = {};
      }
      for (const player of Object.values(room.players)) {
        if (!room.submissions[roundIndex][player.id]) {
          room.submissions[roundIndex][player.id] = {
            playerId: player.id,
            roundIndex,
            answers: {},
            completionTimeMs: room.roundDurationSeconds * 1000,
            correctCount: 0,
            wrongCount: question.items.length,
            scoreAwarded: 0,
            submittedAt: Date.now(),
          };
        }
      }
    }

    db.saveGame(room);

    this.broadcastHostState(room.roomCode);
    this.broadcastPlayerStates(room.roomCode);
  }

  public nextRound(roomCode: string): boolean {
    const room = this.getRoom(roomCode);
    if (!room || room.status !== 'ROUND_COMPLETED') return false;

    const nextIndex = room.currentRoundIndex + 1;
    if (nextIndex >= room.questions.length) {
      this.completeGame(roomCode);
      return true;
    }

    room.currentRoundIndex = nextIndex;
    room.status = 'STARTING';
    db.saveGame(room);

    this.broadcastHostState(room.roomCode);
    this.broadcastPlayerStates(room.roomCode);

    let countdown = 3;
    this.broadcastToRoom(room.roomCode, 'game:starting_countdown', { countdown });

    const interval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        this.broadcastToRoom(room.roomCode, 'game:starting_countdown', { countdown });
      } else {
        clearInterval(interval);
        this.broadcastToRoom(room.roomCode, 'game:starting_countdown', { countdown: 0 });
        this.beginRound(room.roomCode, nextIndex);
      }
    }, 1000);

    return true;
  }

  public completeGame(roomCode: string) {
    const room = this.getRoom(roomCode);
    if (!room) return;

    this.clearRoomTimer(roomCode);
    room.status = 'GAME_COMPLETED';
    db.saveGame(room);

    this.broadcastHostState(room.roomCode);
    this.broadcastPlayerStates(room.roomCode);
  }

  // ==========================================
  // QUIZ PHASE REALTIME METHODS
  // ==========================================

  public startQuiz(roomCode: string): { success: boolean; error?: string } {
    const room = this.getRoom(roomCode);
    if (!room) return { success: false, error: 'Room not found' };

    // EMPTY QUIZ PROTECTION: If Host clicks START QUIZ without adding any Quiz Questions
    const quizQuestions = room.quizQuestions || [];
    if (!quizQuestions || quizQuestions.length === 0) {
      return { success: false, error: 'Add at least one quiz question before starting the quiz.' };
    }

    this.clearRoomTimer(room.roomCode);

    room.currentQuizIndex = 0;
    room.status = 'QUIZ_STARTING';
    room.quizSubmissions = {};
    db.saveGame(room);

    this.broadcastHostState(room.roomCode);
    this.broadcastPlayerStates(room.roomCode);

    // 3 second synchronized countdown
    let countdown = 3;
    this.broadcastToRoom(room.roomCode, 'game:starting_countdown', { countdown });

    const interval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        this.broadcastToRoom(room.roomCode, 'game:starting_countdown', { countdown });
      } else {
        clearInterval(interval);
        this.broadcastToRoom(room.roomCode, 'game:starting_countdown', { countdown: 0 });
        this.beginQuizQuestion(room.roomCode, 0);
      }
    }, 1000);

    return { success: true };
  }

  public beginQuizQuestion(roomCode: string, quizIndex: number) {
    const room = this.getRoom(roomCode);
    if (!room) return;

    const quizQuestions = room.quizQuestions || [];
    if (quizIndex >= quizQuestions.length) {
      this.completeQuiz(roomCode);
      return;
    }

    const question = quizQuestions[quizIndex];
    const durationSeconds = question.timeLimitSeconds || 20;

    room.status = 'QUIZ_PLAYING';
    room.currentQuizIndex = quizIndex;
    room.roundStartTime = Date.now();
    room.roundDurationSeconds = durationSeconds;
    room.isPaused = false;
    room.pausedRemainingSeconds = null;

    if (!room.quizSubmissions[quizIndex]) {
      room.quizSubmissions[quizIndex] = {};
    }

    db.saveGame(room);

    this.clearRoomTimer(room.roomCode);

    this.broadcastToRoom(room.roomCode, 'game:timer_tick', {
      timeRemainingSeconds: durationSeconds,
    });

    this.startRoomInterval(room.roomCode);

    this.broadcastHostState(room.roomCode);
    this.broadcastPlayerStates(room.roomCode);
  }

  public submitPlayerQuizAnswer(
    roomCode: string,
    playerId: string,
    selectedOption: string
  ): QuizSubmission | null {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    const isPlaying = room.status === 'QUIZ_PLAYING';
    const isGracePeriod = room.status === 'QUIZ_ROUND_COMPLETED';
    if (!isPlaying && !isGracePeriod) return null;

    const player = room.players[playerId];
    if (!player) return null;

    const quizIndex = room.currentQuizIndex;
    const question = (room.quizQuestions || [])[quizIndex];
    if (!question) return null;

    // Check if player already submitted
    const existingSub = room.quizSubmissions[quizIndex]?.[playerId];
    if (existingSub) {
      return existingSub;
    }

    const roundStartTime = room.roundStartTime || Date.now();
    const completionTimeMs = Math.max(100, Date.now() - roundStartTime);

    // Calculate score based on accuracy + speed
    const scoreResult = calculateQuizScore(question, selectedOption, completionTimeMs);

    const submission: QuizSubmission = {
      playerId,
      questionIndex: quizIndex,
      selectedOption,
      isCorrect: scoreResult.isCorrect,
      completionTimeMs,
      scoreAwarded: scoreResult.scoreAwarded,
      submittedAt: Date.now(),
    };

    if (!room.quizSubmissions[quizIndex]) {
      room.quizSubmissions[quizIndex] = {};
    }

    room.quizSubmissions[quizIndex][playerId] = submission;
    player.totalScore += scoreResult.scoreAwarded;

    db.saveGame(room);

    // Broadcast updated live scoreboard to host (with selected option and score)
    this.broadcastHostState(room.roomCode);

    // Send player their own private state with locked answer
    this.broadcastPlayerState(room.roomCode, playerId);

    // Check if all connected players have submitted
    if (room.status === 'QUIZ_PLAYING') {
      const connectedPlayers = Object.values(room.players).filter((p) => p.isConnected);
      const roundSubmissions = Object.keys(room.quizSubmissions[quizIndex] || {});
      const allSubmitted =
        connectedPlayers.length > 0 &&
        connectedPlayers.every((p) => roundSubmissions.includes(p.id));

      if (allSubmitted) {
        this.finishQuizQuestion(room.roomCode);
      }
    }

    return submission;
  }

  public finishQuizQuestion(roomCode: string) {
    const room = this.getRoom(roomCode);
    if (!room || room.status !== 'QUIZ_PLAYING') return;

    this.clearRoomTimer(roomCode);
    room.status = 'QUIZ_ROUND_COMPLETED';

    const quizIndex = room.currentQuizIndex;
    const question = (room.quizQuestions || [])[quizIndex];

    if (question) {
      if (!room.quizSubmissions[quizIndex]) {
        room.quizSubmissions[quizIndex] = {};
      }
      for (const player of Object.values(room.players)) {
        if (!room.quizSubmissions[quizIndex][player.id]) {
          room.quizSubmissions[quizIndex][player.id] = {
            playerId: player.id,
            questionIndex: quizIndex,
            selectedOption: '',
            isCorrect: false,
            completionTimeMs: room.roundDurationSeconds * 1000,
            scoreAwarded: 0,
            submittedAt: Date.now(),
          };
        }
      }
    }

    db.saveGame(room);

    this.broadcastHostState(room.roomCode);
    this.broadcastPlayerStates(room.roomCode);
  }

  public nextQuizQuestion(roomCode: string): boolean {
    const room = this.getRoom(roomCode);
    if (!room || room.status !== 'QUIZ_ROUND_COMPLETED') return false;

    const quizQuestions = room.quizQuestions || [];
    const nextIndex = room.currentQuizIndex + 1;

    if (nextIndex >= quizQuestions.length) {
      this.completeQuiz(roomCode);
      return true;
    }

    room.currentQuizIndex = nextIndex;
    room.status = 'QUIZ_STARTING';
    db.saveGame(room);

    this.broadcastHostState(room.roomCode);
    this.broadcastPlayerStates(room.roomCode);

    let countdown = 3;
    this.broadcastToRoom(room.roomCode, 'game:starting_countdown', { countdown });

    const interval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        this.broadcastToRoom(room.roomCode, 'game:starting_countdown', { countdown });
      } else {
        clearInterval(interval);
        this.broadcastToRoom(room.roomCode, 'game:starting_countdown', { countdown: 0 });
        this.beginQuizQuestion(room.roomCode, nextIndex);
      }
    }, 1000);

    return true;
  }

  public completeQuiz(roomCode: string) {
    const room = this.getRoom(roomCode);
    if (!room) return;

    this.clearRoomTimer(roomCode);
    room.status = 'QUIZ_COMPLETED';
    db.saveGame(room);

    this.broadcastHostState(room.roomCode);
    this.broadcastPlayerStates(room.roomCode);
  }

  public updateQuizQuestions(roomCode: string, quizQuestions: QuizQuestion[]): boolean {
    const room = this.getRoom(roomCode);
    if (!room) return false;

    room.quizQuestions = quizQuestions;
    db.saveGame(room);
    this.broadcastHostState(room.roomCode);
    return true;
  }

  public setRevealLeaderboard(roomCode: string, reveal: boolean): boolean {
    const room = this.getRoom(roomCode);
    if (!room) return false;

    room.revealLeaderboard = reveal;
    db.saveGame(room);

    this.broadcastHostState(room.roomCode);
    this.broadcastPlayerStates(room.roomCode);
    return true;
  }

  public updateQuestions(roomCode: string, questions: Question[]): boolean {
    const room = this.getRoom(roomCode);
    if (!room) return false;

    room.questions = questions;
    db.saveGame(room);
    this.broadcastHostState(room.roomCode);
    this.broadcastPlayerStates(room.roomCode);
    return true;
  }

  public kickPlayer(roomCode: string, playerId: string): boolean {
    const room = this.getRoom(roomCode);
    if (!room) return false;

    const player = room.players[playerId];
    if (!player) return false;

    if (this.io && player.socketId) {
      this.io.to(player.socketId).emit('player:kicked', {
        message: 'You have been kicked out of the room by the host.',
      });
      const socket = this.io.sockets.sockets.get(player.socketId);
      if (socket) {
        socket.leave(room.roomCode.toUpperCase());
      }
    }

    delete room.players[playerId];

    for (const roundSubs of Object.values(room.submissions)) {
      if (roundSubs[playerId]) {
        delete roundSubs[playerId];
      }
    }
    for (const quizSubs of Object.values(room.quizSubmissions || {})) {
      if (quizSubs[playerId]) {
        delete quizSubs[playerId];
      }
    }

    db.saveGame(room);

    this.broadcastHostState(room.roomCode);
    this.broadcastToRoom(room.roomCode, 'player:list_updated', {
      players: Object.values(room.players).map((p) => ({ id: p.id, name: p.name, isConnected: p.isConnected })),
    });
    this.broadcastPlayerStates(room.roomCode);

    return true;
  }

  public updateSettings(roomCode: string, title: string, timeLimit: number): boolean {
    const room = this.getRoom(roomCode);
    if (!room || room.status !== 'WAITING') return false;

    room.title = title;
    room.defaultTimeLimitSeconds = timeLimit;
    db.saveGame(room);
    this.broadcastHostState(room.roomCode);
    return true;
  }

  private startRoomInterval(roomCode: string) {
    const existing = this.roomIntervals.get(roomCode);
    if (existing) {
      clearInterval(existing);
      this.roomIntervals.delete(roomCode);
    }

    const interval = setInterval(() => {
      const room = this.getRoom(roomCode);
      const isCategorizing = room?.status === 'PLAYING';
      const isQuiz = room?.status === 'QUIZ_PLAYING';
      if (!room || (!isCategorizing && !isQuiz)) {
        this.clearRoomTimer(roomCode);
        return;
      }
      if (room.isPaused) return;

      const elapsed = (Date.now() - (room.roundStartTime || Date.now())) / 1000;
      const remaining = Math.max(0, Math.ceil(room.roundDurationSeconds - elapsed));

      this.broadcastToRoom(room.roomCode, 'game:timer_tick', {
        timeRemainingSeconds: remaining,
      });

      if (remaining <= 0) {
        if (isCategorizing) {
          this.finishRound(room.roomCode);
        } else if (isQuiz) {
          this.finishQuizQuestion(room.roomCode);
        }
      }
    }, 1000);

    this.roomIntervals.set(roomCode, interval);
  }

  private clearRoomTimer(roomCode: string) {
    const timer = this.roomTimers.get(roomCode);
    if (timer) {
      clearTimeout(timer);
      this.roomTimers.delete(roomCode);
    }
    const interval = this.roomIntervals.get(roomCode);
    if (interval) {
      clearInterval(interval);
      this.roomIntervals.delete(roomCode);
    }
  }

  // STATE SANITIZATION & BROADCASTING
  public sanitizeQuestion(question: Question | null): QuestionPublic | null {
    if (!question) return null;
    return {
      id: question.id,
      title: question.title,
      timeLimitSeconds: question.timeLimitSeconds || 30,
      categories: question.categories,
      items: question.items.map((item) => ({ id: item.id, name: item.name, imageUrl: item.imageUrl })),
    };
  }

  public sanitizeQuizQuestion(question: QuizQuestion | null): QuizQuestionPublic | null {
    if (!question) return null;
    return {
      id: question.id,
      imageUrl: question.imageUrl,
      text: question.text,
      options: question.options,
      timeLimitSeconds: question.timeLimitSeconds || 20,
    };
  }

  public getHostDashboardState(room: GameRoom): HostDashboardState {
    const isQuizPhase =
      room.status === 'QUIZ_STARTING' ||
      room.status === 'QUIZ_PLAYING' ||
      room.status === 'QUIZ_ROUND_COMPLETED' ||
      room.status === 'QUIZ_COMPLETED';

    const currentQ = room.questions[room.currentRoundIndex] || null;
    const currentQuizQ = (room.quizQuestions || [])[room.currentQuizIndex] || null;
    const roundSubmissions = room.submissions[room.currentRoundIndex] || {};
    const quizSubmissions = (room.quizSubmissions || {})[room.currentQuizIndex] || {};

    let remainingSeconds = 0;
    if (room.status === 'PLAYING' || room.status === 'QUIZ_PLAYING') {
      if (room.isPaused) {
        remainingSeconds = Math.max(0, Math.round(room.pausedRemainingSeconds || 0));
      } else if (room.roundStartTime) {
        const elapsed = (Date.now() - room.roundStartTime) / 1000;
        remainingSeconds = Math.max(0, Math.ceil(room.roundDurationSeconds - elapsed));
      }
    }

    const playersList = Object.values(room.players);
    playersList.sort((a, b) => b.totalScore - a.totalScore);

    const livePlayers: HostLivePlayerRow[] = playersList.map((p, idx) => {
      if (isQuizPhase) {
        const quizSub = quizSubmissions[p.id];
        let status: PlayerRoundStatus = 'thinking';
        if (quizSub) {
          status = 'submitted';
        }
        return {
          rank: idx + 1,
          playerId: p.id,
          playerName: p.name,
          isConnected: p.isConnected,
          status,
          correctCount: quizSub && quizSub.isCorrect ? 1 : 0,
          wrongCount: quizSub && !quizSub.isCorrect ? 1 : 0,
          completionTimeMs: quizSub ? quizSub.completionTimeMs : null,
          roundScore: quizSub ? quizSub.scoreAwarded : 0,
          totalScore: p.totalScore,
          selectedOption: quizSub ? quizSub.selectedOption : undefined,
        };
      }

      const sub = roundSubmissions[p.id];
      let status: PlayerRoundStatus = 'thinking';
      if (sub) {
        status = 'submitted';
      }

      return {
        rank: idx + 1,
        playerId: p.id,
        playerName: p.name,
        isConnected: p.isConnected,
        status,
        correctCount: sub ? sub.correctCount : 0,
        wrongCount: sub ? sub.wrongCount : 0,
        completionTimeMs: sub ? sub.completionTimeMs : null,
        roundScore: sub ? sub.scoreAwarded : 0,
        totalScore: p.totalScore,
      };
    });

    return {
      roomCode: room.roomCode,
      title: room.title,
      status: room.status,
      currentRoundIndex: room.currentRoundIndex,
      totalRounds: room.questions.length,
      currentQuestion: currentQ,
      timeRemainingSeconds: remainingSeconds,
      isPaused: room.isPaused,
      connectedPlayersCount: playersList.filter((p) => p.isConnected).length,
      revealLeaderboard: room.revealLeaderboard,
      livePlayers,
      quizQuestions: room.quizQuestions || [],
      currentQuizIndex: room.currentQuizIndex || 0,
      currentQuizQuestionIndex: room.currentQuizIndex || 0,
      totalQuizQuestions: (room.quizQuestions || []).length,
      currentQuizQuestion: currentQuizQ,
    };
  }

  public getPlayerGameState(room: GameRoom, playerId: string): PlayerGameState {
    const isQuizPhase =
      room.status === 'QUIZ_STARTING' ||
      room.status === 'QUIZ_PLAYING' ||
      room.status === 'QUIZ_ROUND_COMPLETED' ||
      room.status === 'QUIZ_COMPLETED';

    const player = room.players[playerId];
    const currentQ = room.questions[room.currentRoundIndex] || null;
    const currentQuizQ = (room.quizQuestions || [])[room.currentQuizIndex] || null;
    const currentSubmissions = room.submissions[room.currentRoundIndex] || {};
    const playerSubmission = currentSubmissions[playerId];

    const currentQuizSubmissions = (room.quizSubmissions || {})[room.currentQuizIndex] || {};
    const playerQuizSubmission = currentQuizSubmissions[playerId];

    let remainingSeconds = 0;
    if (room.status === 'PLAYING' || room.status === 'QUIZ_PLAYING') {
      if (room.isPaused) {
        remainingSeconds = Math.max(0, Math.round(room.pausedRemainingSeconds || 0));
      } else if (room.roundStartTime) {
        const elapsed = (Date.now() - room.roundStartTime) / 1000;
        remainingSeconds = Math.max(0, Math.ceil(room.roundDurationSeconds - elapsed));
      }
    }

    let finalStats: PlayerGameState['finalStats'] = undefined;
    let finalLeaderboard: PlayerGameState['finalLeaderboard'] = undefined;

    if (room.status === 'GAME_COMPLETED' || room.status === 'QUIZ_COMPLETED') {
      let totalCorrect = 0;
      let totalWrong = 0;
      let totalTimeMs = 0;

      for (let r = 0; r < room.questions.length; r++) {
        const sub = room.submissions[r]?.[playerId];
        if (sub) {
          totalCorrect += sub.correctCount;
          totalWrong += sub.wrongCount;
          totalTimeMs += sub.completionTimeMs;
        }
      }

      if (room.quizSubmissions) {
        for (const quizSubs of Object.values(room.quizSubmissions)) {
          const qsub = quizSubs[playerId];
          if (qsub) {
            if (qsub.isCorrect) totalCorrect += 1;
            else totalWrong += 1;
            totalTimeMs += qsub.completionTimeMs;
          }
        }
      }

      const totalItems = totalCorrect + totalWrong;
      const accuracyPercent = totalItems > 0 ? Math.round((totalCorrect / totalItems) * 100) : 0;

      const allPlayersSorted = Object.values(room.players).sort((a, b) => b.totalScore - a.totalScore);
      const playerRank = allPlayersSorted.findIndex((p) => p.id === playerId) + 1;

      finalStats = {
        totalScore: player ? player.totalScore : 0,
        totalCorrect,
        totalWrong,
        totalTimeSeconds: Math.round(totalTimeMs / 1000),
        accuracyPercent,
        rank: playerRank,
      };

      if (room.revealLeaderboard || room.status === 'QUIZ_COMPLETED') {
        finalLeaderboard = allPlayersSorted.map((p, idx) => {
          let pCorrect = 0;
          let pWrong = 0;
          for (let r = 0; r < room.questions.length; r++) {
            const sub = room.submissions[r]?.[p.id];
            if (sub) {
              pCorrect += sub.correctCount;
              pWrong += sub.wrongCount;
            }
          }
          if (room.quizSubmissions) {
            for (const quizSubs of Object.values(room.quizSubmissions)) {
              const qsub = quizSubs[p.id];
              if (qsub) {
                if (qsub.isCorrect) pCorrect += 1;
                else pWrong += 1;
              }
            }
          }
          const pTotal = pCorrect + pWrong;
          return {
            rank: idx + 1,
            name: p.name,
            score: p.totalScore,
            accuracyPercent: pTotal > 0 ? Math.round((pCorrect / pTotal) * 100) : 0,
          };
        });
      }
    }

    return {
      roomCode: room.roomCode,
      playerName: player ? player.name : '',
      status: room.status,
      currentRoundIndex: room.currentRoundIndex,
      totalRounds: room.questions.length,
      currentQuestion: this.sanitizeQuestion(currentQ),
      timeRemainingSeconds: remainingSeconds,
      isPaused: room.isPaused,
      playerScore: player ? player.totalScore : 0,
      playerRoundSubmitted: !!playerSubmission,
      currentQuizIndex: room.currentQuizIndex || 0,
      currentQuizQuestionIndex: room.currentQuizIndex || 0,
      totalQuizQuestions: (room.quizQuestions || []).length,
      currentQuizQuestion: this.sanitizeQuizQuestion(currentQuizQ),
      playerQuizSubmitted: !!playerQuizSubmission,
      playerSelectedOption: playerQuizSubmission ? playerQuizSubmission.selectedOption : undefined,
      lastQuizResult: playerQuizSubmission
        ? {
            isCorrect: playerQuizSubmission.isCorrect,
            correctOption: currentQuizQ?.correctOption || '',
            scoreAwarded: playerQuizSubmission.scoreAwarded,
            totalScore: player ? player.totalScore : 0,
          }
        : undefined,
      lastRoundResult: playerSubmission
        ? {
            correctCount: playerSubmission.correctCount,
            wrongCount: playerSubmission.wrongCount,
            completionTimeMs: playerSubmission.completionTimeMs,
            scoreAwarded: playerSubmission.scoreAwarded,
            totalScore: player ? player.totalScore : 0,
          }
        : undefined,
      finalStats,
      finalLeaderboard,
      connectedPlayers: Object.values(room.players).map((p) => ({
        id: p.id,
        name: p.name,
        isConnected: p.isConnected,
      })),
    };
  }

  public broadcastHostState(roomCode: string) {
    if (!this.io) return;
    const room = this.getRoom(roomCode);
    if (!room) return;

    const state = this.getHostDashboardState(room);
    if (room.hostSocketId) {
      this.io.to(room.hostSocketId).emit('host:state_update', state);
    }
    this.io.to(room.roomCode.toUpperCase()).emit('host:state_update', state);
  }

  public broadcastPlayerState(roomCode: string, playerId: string) {
    if (!this.io) return;
    const room = this.getRoom(roomCode);
    if (!room) return;

    const player = room.players[playerId];
    if (!player || !player.socketId) return;

    const state = this.getPlayerGameState(room, playerId);
    this.io.to(player.socketId).emit('player:state_update', state);
  }

  public broadcastPlayerStates(roomCode: string) {
    const room = this.getRoom(roomCode);
    if (!room) return;

    for (const player of Object.values(room.players)) {
      if (player.isConnected && player.socketId) {
        this.broadcastPlayerState(roomCode, player.id);
      }
    }
  }

  public broadcastToRoom(roomCode: string, event: string, payload: any) {
    if (!this.io) return;
    this.io.to(roomCode).emit(event, payload);
  }
}

export const gameManager = new GameManager();
