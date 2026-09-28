import { Server, Socket } from 'socket.io';
import { gameManager } from '../services/gameManager.js';

export function registerSocketHandlers(io: Server) {
  gameManager.setSocketServer(io);

  io.on('connection', (socket: Socket) => {
    // HOST REGISTRATION
    socket.on('host:register', (data: { roomCode: string; hostToken: string }, callback?: Function) => {
      const { roomCode, hostToken } = data || {};
      if (!roomCode || !hostToken) {
        if (callback) callback({ success: false, error: 'Missing parameters' });
        return;
      }

      const upperCode = roomCode.trim().toUpperCase();
      socket.join(upperCode);
      const success = gameManager.registerHostSocket(upperCode, socket.id, hostToken);
      if (success) {
        const room = gameManager.getRoom(upperCode);
        const hostState = room ? gameManager.getHostDashboardState(room) : null;
        if (callback) callback({ success: true, state: hostState });
      } else {
        socket.leave(upperCode);
        if (callback) callback({ success: false, error: 'Invalid room code or host token' });
      }
    });

    // HOST GAME ACTIONS
    socket.on('host:start_game', (data: { roomCode: string }) => {
      gameManager.startGame(data.roomCode);
    });

    socket.on('host:pause_game', (data: { roomCode: string }) => {
      gameManager.pauseGame(data.roomCode);
    });

    socket.on('host:resume_game', (data: { roomCode: string }) => {
      gameManager.resumeGame(data.roomCode);
    });

    socket.on('host:next_round', (data: { roomCode: string }) => {
      gameManager.nextRound(data.roomCode);
    });

    socket.on('host:end_game', (data: { roomCode: string }) => {
      gameManager.completeGame(data.roomCode);
    });

    socket.on('host:reveal_leaderboard', (data: { roomCode: string; reveal: boolean }) => {
      gameManager.setRevealLeaderboard(data.roomCode, data.reveal);
    });

    socket.on('host:update_questions', (data: { roomCode: string; questions: any[] }) => {
      gameManager.updateQuestions(data.roomCode, data.questions);
    });

    socket.on('host:update_settings', (data: { roomCode: string; title: string; timeLimit: number }) => {
      gameManager.updateSettings(data.roomCode, data.title, data.timeLimit);
    });

    socket.on('host:kick_player', (data: { roomCode: string; playerId: string }, callback?: Function) => {
      const { roomCode, playerId } = data || {};
      if (!roomCode || !playerId) {
        if (callback) callback({ success: false, error: 'Missing parameters' });
        return;
      }
      const success = gameManager.kickPlayer(roomCode.trim().toUpperCase(), playerId);
      if (callback) callback({ success });
    });

    // PLAYER ACTIONS
    socket.on('player:join', (data: { roomCode: string; playerName: string }, callback?: Function) => {
      const { roomCode, playerName } = data || {};
      if (!roomCode || !playerName) {
        if (callback) callback({ success: false, error: 'Room code and player name are required' });
        return;
      }

      const upperCode = roomCode.trim().toUpperCase();
      socket.join(upperCode);
      const result = gameManager.addPlayer(upperCode, playerName, socket.id);

      if (!result) {
        socket.leave(upperCode);
        if (callback) callback({ success: false, error: 'Game room not found or cannot join' });
        return;
      }

      const room = gameManager.getRoom(upperCode);
      const playersList = room
        ? Object.values(room.players).map((p) => ({ id: p.id, name: p.name, isConnected: p.isConnected }))
        : [];

      if (callback) {
        callback({
          success: true,
          player: result.player,
          sessionToken: result.sessionToken,
          players: playersList,
        });
      }

      // Send initial game state to player
      gameManager.broadcastPlayerState(upperCode, result.player.id);
    });

    socket.on('player:reconnect', (data: { roomCode: string; sessionToken: string }, callback?: Function) => {
      const { roomCode, sessionToken } = data || {};
      if (!roomCode || !sessionToken) {
        if (callback) callback({ success: false, error: 'Missing parameters' });
        return;
      }

      const upperCode = roomCode.trim().toUpperCase();
      socket.join(upperCode);
      const player = gameManager.reconnectPlayer(upperCode, sessionToken, socket.id);

      if (!player) {
        socket.leave(upperCode);
        if (callback) callback({ success: false, error: 'Session expired or room not found' });
        return;
      }

      const room = gameManager.getRoom(upperCode);
      const playersList = room
        ? Object.values(room.players).map((p) => ({ id: p.id, name: p.name, isConnected: p.isConnected }))
        : [];

      if (callback) callback({ success: true, player, players: playersList });
    });

    socket.on('player:submit_answers', (data: { roomCode: string; playerId: string; answers: Record<string, string> }, callback?: Function) => {
      const { roomCode, playerId, answers } = data || {};
      if (!roomCode || !playerId || !answers) {
        if (callback) callback({ success: false, error: 'Invalid submission' });
        return;
      }

      const upperCode = roomCode.trim().toUpperCase();
      const submission = gameManager.submitPlayerAnswers(upperCode, playerId, answers);

      if (submission) {
        if (callback) {
          callback({
            success: true,
            submission: {
              correctCount: submission.correctCount,
              wrongCount: submission.wrongCount,
              scoreAwarded: submission.scoreAwarded,
              completionTimeMs: submission.completionTimeMs,
            },
          });
        }
      } else {
        if (callback) callback({ success: false, error: 'Submission rejected or round closed' });
      }
    });

    // HOST QUIZ PHASE ACTIONS
    socket.on('host:start_quiz', (data: { roomCode: string }, callback?: Function) => {
      const { roomCode } = data || {};
      if (!roomCode) {
        if (callback) callback({ success: false, error: 'Room code required' });
        return;
      }
      const result = gameManager.startQuiz(roomCode.trim().toUpperCase());
      if (callback) callback(result);
    });

    socket.on('host:next_quiz_question', (data: { roomCode: string }, callback?: Function) => {
      const { roomCode } = data || {};
      if (!roomCode) return;
      const success = gameManager.nextQuizQuestion(roomCode.trim().toUpperCase());
      if (callback) callback({ success });
    });

    socket.on('host:end_quiz', (data: { roomCode: string }) => {
      const { roomCode } = data || {};
      if (!roomCode) return;
      gameManager.completeQuiz(roomCode.trim().toUpperCase());
    });

    socket.on('host:update_quiz_questions', (data: { roomCode: string; quizQuestions: any[] }) => {
      const { roomCode, quizQuestions } = data || {};
      if (!roomCode || !Array.isArray(quizQuestions)) return;
      gameManager.updateQuizQuestions(roomCode.trim().toUpperCase(), quizQuestions);
    });

    // PLAYER QUIZ ACTIONS
    socket.on('player:submit_quiz_answer', (data: { roomCode: string; playerId: string; selectedOption: string }, callback?: Function) => {
      const { roomCode, playerId, selectedOption } = data || {};
      if (!roomCode || !playerId) {
        if (callback) callback({ success: false, error: 'Invalid submission parameters' });
        return;
      }

      const upperCode = roomCode.trim().toUpperCase();
      const submission = gameManager.submitPlayerQuizAnswer(upperCode, playerId, selectedOption || '');

      if (submission) {
        if (callback) {
          callback({
            success: true,
            submission: {
              isCorrect: submission.isCorrect,
              scoreAwarded: submission.scoreAwarded,
              completionTimeMs: submission.completionTimeMs,
            },
          });
        }
      } else {
        if (callback) callback({ success: false, error: 'Quiz submission rejected or question closed' });
      }
    });

    // DISCONNECT
    socket.on('disconnect', () => {
      gameManager.handleDisconnect(socket.id);
    });
  });
}
