import React, { useState, useEffect } from 'react';
import { socketService, SERVER_URL } from './services/socket';
import { LandingPage } from './views/LandingPage';
import { HostDashboard } from './views/HostDashboard';
import { PlayerGameView } from './views/PlayerGameView';
import { HostDashboardState, PlayerGameState, Question, QuizQuestion } from './types';

export const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'host' | 'player'>('landing');
  const [isCreating, setIsCreating] = useState(false);

  // Host state
  const [hostToken, setHostToken] = useState<string>('');
  const [hostRoomCode, setHostRoomCode] = useState<string>('');
  const [hostState, setHostState] = useState<HostDashboardState | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  // Player state
  const [playerRoomCode, setPlayerRoomCode] = useState<string>('');
  const [playerId, setPlayerId] = useState<string>('');
  const [playerSessionToken, setPlayerSessionToken] = useState<string>('');
  const [playerState, setPlayerState] = useState<PlayerGameState | null>(null);
  const [connectedPlayers, setConnectedPlayers] = useState<Array<{ id: string; name: string; isConnected: boolean }>>([]);
  const [countdown, setCountdown] = useState<number | null>(null);

  const socket = socketService.getSocket();

  // Socket listener setup
  useEffect(() => {
    socket.on('host:state_update', (data: HostDashboardState) => {
      setHostState(data);
      if (
        data.status === 'PLAYING' ||
        data.status === 'ROUND_COMPLETED' ||
        data.status === 'QUIZ_PLAYING' ||
        data.status === 'QUIZ_ROUND_COMPLETED'
      ) {
        setCountdown(null);
      }
    });

    socket.on('player:state_update', (data: PlayerGameState) => {
      setPlayerState(data);
      if (data.connectedPlayers) {
        setConnectedPlayers(data.connectedPlayers);
      }
      if (
        data.status === 'PLAYING' ||
        data.status === 'ROUND_COMPLETED' ||
        data.status === 'QUIZ_PLAYING' ||
        data.status === 'QUIZ_ROUND_COMPLETED'
      ) {
        setCountdown(null);
      }
    });

    socket.on('player:joined_room', (data: { players: Array<{ id: string; name: string; isConnected: boolean }> }) => {
      setConnectedPlayers(data.players);
    });

    socket.on('player:list_updated', (data: { players: Array<{ id: string; name: string; isConnected: boolean }> }) => {
      setConnectedPlayers(data.players);
    });

    socket.on('game:starting_countdown', (data: { countdown: number }) => {
      setCountdown(data.countdown);
    });

    socket.on('game:timer_tick', (data: { timeRemainingSeconds: number }) => {
      setPlayerState((prev) => (prev ? { ...prev, timeRemainingSeconds: data.timeRemainingSeconds } : prev));
      setHostState((prev) => (prev ? { ...prev, timeRemainingSeconds: data.timeRemainingSeconds } : prev));
    });

    socket.on('player:kicked', (data: { message?: string }) => {
      localStorage.removeItem('categorize_player_room');
      localStorage.removeItem('categorize_player_token');
      localStorage.removeItem('categorize_player_id');
      setPlayerState(null);
      setConnectedPlayers([]);
      alert(data?.message || 'You have been removed from the room by the host.');
      setView('landing');
    });

    return () => {
      socket.off('host:state_update');
      socket.off('player:state_update');
      socket.off('player:joined_room');
      socket.off('player:list_updated');
      socket.off('game:starting_countdown');
      socket.off('game:timer_tick');
      socket.off('player:kicked');
    };
  }, [socket]);

  // Load questions for host
  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/questions`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    }
  };

  // Load quiz questions for host
  const fetchQuizQuestions = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/quiz-questions`);
      if (res.ok) {
        const data = await res.json();
        setQuizQuestions(data);
      }
    } catch (err) {
      console.error('Failed to fetch quiz questions:', err);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchQuizQuestions();
  }, []);

  // 1. HOST CREATES GAME
  const handleCreateGame = async (title: string, defaultTimeLimit: number) => {
    setIsCreating(true);
    setConnectedPlayers([]);
    try {
      // Ensure questions & quiz questions are loaded
      let currentQuestions = questions;
      if (currentQuestions.length === 0) {
        const qRes = await fetch(`${SERVER_URL}/api/questions`);
        if (qRes.ok) {
          currentQuestions = await qRes.json();
          setQuestions(currentQuestions);
        }
      }

      let currentQuizQuestions = quizQuestions;
      if (currentQuizQuestions.length === 0) {
        const qqRes = await fetch(`${SERVER_URL}/api/quiz-questions`);
        if (qqRes.ok) {
          currentQuizQuestions = await qqRes.json();
          setQuizQuestions(currentQuizQuestions);
        }
      }

      const res = await fetch(`${SERVER_URL}/api/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          defaultTimeLimitSeconds: defaultTimeLimit,
          questions: currentQuestions,
          quizQuestions: currentQuizQuestions,
        }),
      });

      if (!res.ok) throw new Error('Failed to create game room');
      const data = await res.json();

      setHostRoomCode(data.roomCode);
      setHostToken(data.hostToken);

      // Register socket as host
      socket.emit('host:register', { roomCode: data.roomCode, hostToken: data.hostToken }, (authRes: any) => {
        if (authRes?.success) {
          if (authRes.state) {
            setHostState(authRes.state);
          }
          setView('host');
        }
      });
    } catch (err: any) {
      alert(err.message || 'Error creating game');
    } finally {
      setIsCreating(false);
    }
  };

  // 2. PLAYER JOINS GAME
  const handleJoinGame = (roomCode: string, playerName: string) => {
    setConnectedPlayers([]);
    socket.emit('player:join', { roomCode, playerName }, (res: any) => {
      if (res?.success) {
        setPlayerRoomCode(roomCode);
        setPlayerId(res.player.id);
        setPlayerSessionToken(res.sessionToken);
        if (res.players) {
          setConnectedPlayers(res.players);
        }

        // Save session in localStorage
        localStorage.setItem('categorize_player_room', roomCode);
        localStorage.setItem('categorize_player_token', res.sessionToken);
        localStorage.setItem('categorize_player_id', res.player.id);

        setView('player');
      } else {
        alert(res?.error || 'Could not join room');
      }
    });
  };

  // HOST CATEGORIZATION GAME CONTROLS
  const handleStartGame = () => {
    socket.emit('host:start_game', { roomCode: hostRoomCode });
  };

  const handlePauseGame = () => {
    socket.emit('host:pause_game', { roomCode: hostRoomCode });
  };

  const handleResumeGame = () => {
    socket.emit('host:resume_game', { roomCode: hostRoomCode });
  };

  const handleNextRound = () => {
    socket.emit('host:next_round', { roomCode: hostRoomCode });
  };

  const handleEndGame = () => {
    socket.emit('host:end_game', { roomCode: hostRoomCode });
  };

  // HOST QUIZ GAME CONTROLS
  const handleStartQuiz = () => {
    socket.emit('host:start_quiz', { roomCode: hostRoomCode });
  };

  const handleNextQuizQuestion = () => {
    socket.emit('host:next_quiz_question', { roomCode: hostRoomCode });
  };

  const handleEndQuiz = () => {
    socket.emit('host:end_quiz', { roomCode: hostRoomCode });
  };

  const handleToggleRevealLeaderboard = (reveal: boolean) => {
    socket.emit('host:reveal_leaderboard', { roomCode: hostRoomCode, reveal });
  };

  // HOST QUESTION CRUD & REORDERING
  const handleSaveQuestion = async (q: Partial<Question>) => {
    try {
      const isEdit = !!q.id;
      const url = isEdit ? `${SERVER_URL}/api/questions/${q.id}` : `${SERVER_URL}/api/questions`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(q),
      });

      if (res.ok) {
        await fetchQuestions();
        const qRes = await fetch(`${SERVER_URL}/api/questions`);
        if (qRes.ok) {
          const updated = await qRes.json();
          setQuestions(updated);
          // Sync questions to current active room immediately
          if (hostRoomCode) {
            socket.emit('host:update_questions', { roomCode: hostRoomCode, questions: updated });
          }
        }
      }
    } catch (err) {
      console.error('Error saving question:', err);
    }
  };

  const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const newQuestions = [...questions];
    const [moved] = newQuestions.splice(index, 1);
    newQuestions.splice(targetIndex, 0, moved);

    setQuestions(newQuestions);

    if (hostRoomCode) {
      socket.emit('host:update_questions', { roomCode: hostRoomCode, questions: newQuestions });
    }

    try {
      await fetch(`${SERVER_URL}/api/questions/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: newQuestions }),
      });
    } catch (err) {
      console.error('Error saving reordered questions:', err);
    }
  };

  const handleShuffleQuestionItems = async (questionId: string) => {
    const targetQ = questions.find((q) => q.id === questionId);
    if (!targetQ) return;

    const shuffledItems = [...targetQ.items].sort(() => Math.random() - 0.5);
    const updatedQuestion = { ...targetQ, items: shuffledItems };

    const newQuestions = questions.map((q) => (q.id === questionId ? updatedQuestion : q));
    setQuestions(newQuestions);

    if (hostRoomCode) {
      socket.emit('host:update_questions', { roomCode: hostRoomCode, questions: newQuestions });
    }

    try {
      await fetch(`${SERVER_URL}/api/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedQuestion),
      });
    } catch (err) {
      console.error('Error updating shuffled question items:', err);
    }
  };

  const handleKickPlayer = (kickedPlayerId: string) => {
    if (hostRoomCode) {
      socket.emit('host:kick_player', { roomCode: hostRoomCode, playerId: kickedPlayerId });
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (questions.length <= 1) {
      alert('You must have at least one question in the game!');
      return;
    }
    try {
      const res = await fetch(`${SERVER_URL}/api/questions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const filtered = questions.filter((q) => q.id !== id);
        setQuestions(filtered);
        socket.emit('host:update_questions', { roomCode: hostRoomCode, questions: filtered });
      }
    } catch (err) {
      console.error('Error deleting question:', err);
    }
  };

  const handleDuplicateQuestion = async (id: string) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/questions/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        await fetchQuestions();
        const qRes = await fetch(`${SERVER_URL}/api/questions`);
        const updated = await qRes.json();
        socket.emit('host:update_questions', { roomCode: hostRoomCode, questions: updated });
      }
    } catch (err) {
      console.error('Error duplicating question:', err);
    }
  };

  const handleRandomizeQuestions = async () => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    socket.emit('host:update_questions', { roomCode: hostRoomCode, questions: shuffled });
    try {
      await fetch(`${SERVER_URL}/api/questions/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: shuffled }),
      });
    } catch (err) {
      console.error('Error saving randomized questions:', err);
    }
  };

  const handleResetSeedQuestions = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/questions/reset-seeds`, { method: 'POST' });
      if (res.ok) {
        const seeds = await res.json();
        setQuestions(seeds);
        socket.emit('host:update_questions', { roomCode: hostRoomCode, questions: seeds });
      }
    } catch (err) {
      console.error('Error resetting seeds:', err);
    }
  };

  // HOST QUIZ QUESTION CRUD
  const handleSaveQuizQuestion = async (qq: Partial<QuizQuestion>) => {
    try {
      const isEdit = !!qq.id;
      const url = isEdit ? `${SERVER_URL}/api/quiz-questions/${qq.id}` : `${SERVER_URL}/api/quiz-questions`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(qq),
      });

      if (res.ok) {
        await fetchQuizQuestions();
        const qqRes = await fetch(`${SERVER_URL}/api/quiz-questions`);
        if (qqRes.ok) {
          const updated = await qqRes.json();
          setQuizQuestions(updated);
          if (hostRoomCode) {
            socket.emit('host:update_quiz_questions', { roomCode: hostRoomCode, quizQuestions: updated });
          }
        }
      }
    } catch (err) {
      console.error('Error saving quiz question:', err);
    }
  };

  const handleDeleteQuizQuestion = async (id: string) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/quiz-questions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const filtered = quizQuestions.filter((q) => q.id !== id);
        setQuizQuestions(filtered);
        if (hostRoomCode) {
          socket.emit('host:update_quiz_questions', { roomCode: hostRoomCode, quizQuestions: filtered });
        }
      }
    } catch (err) {
      console.error('Error deleting quiz question:', err);
    }
  };

  const handleResetSeedQuizQuestions = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/quiz-questions/reset-seeds`, { method: 'POST' });
      if (res.ok) {
        const seeds = await res.json();
        setQuizQuestions(seeds);
        if (hostRoomCode) {
          socket.emit('host:update_quiz_questions', { roomCode: hostRoomCode, quizQuestions: seeds });
        }
      }
    } catch (err) {
      console.error('Error resetting quiz seeds:', err);
    }
  };

  // PLAYER ACTIONS
  const handleSubmitAnswers = (answers: Record<string, string>) => {
    socket.emit(
      'player:submit_answers',
      { roomCode: playerRoomCode, playerId, answers },
      (res: any) => {
        if (!res?.success) {
          alert(res?.error || 'Submission failed');
        }
      }
    );
  };

  const handleSubmitQuizAnswer = (selectedOption: string) => {
    socket.emit(
      'player:submit_quiz_answer',
      { roomCode: playerRoomCode, playerId, selectedOption },
      (res: any) => {
        if (!res?.success) {
          alert(res?.error || 'Quiz submission failed');
        }
      }
    );
  };

  const handleLeavePlayerGame = () => {
    localStorage.removeItem('categorize_player_room');
    localStorage.removeItem('categorize_player_token');
    localStorage.removeItem('categorize_player_id');
    setConnectedPlayers([]);
    setPlayerState(null);
    setView('landing');
  };

  // RENDER CURRENT VIEW
  if (view === 'host' && hostState) {
    return (
      <HostDashboard
        state={hostState}
        questions={questions}
        quizQuestions={quizQuestions}
        onStartGame={handleStartGame}
        onPauseGame={handlePauseGame}
        onResumeGame={handleResumeGame}
        onNextRound={handleNextRound}
        onEndGame={handleEndGame}
        onStartQuiz={handleStartQuiz}
        onNextQuizQuestion={handleNextQuizQuestion}
        onEndQuiz={handleEndQuiz}
        onToggleRevealLeaderboard={handleToggleRevealLeaderboard}
        onSaveQuestion={handleSaveQuestion}
        onMoveQuestion={handleMoveQuestion}
        onShuffleQuestionItems={handleShuffleQuestionItems}
        onDeleteQuestion={handleDeleteQuestion}
        onDuplicateQuestion={handleDuplicateQuestion}
        onRandomizeQuestions={handleRandomizeQuestions}
        onResetSeedQuestions={handleResetSeedQuestions}
        onSaveQuizQuestion={handleSaveQuizQuestion}
        onDeleteQuizQuestion={handleDeleteQuizQuestion}
        onResetSeedQuizQuestions={handleResetSeedQuizQuestions}
        onLeaveDashboard={() => setView('landing')}
        onKickPlayer={handleKickPlayer}
        countdown={countdown}
      />
    );
  }

  if (view === 'player' && playerState) {
    return (
      <PlayerGameView
        state={playerState}
        connectedPlayers={connectedPlayers}
        onSubmitAnswers={handleSubmitAnswers}
        onSubmitQuizAnswer={handleSubmitQuizAnswer}
        onLeaveGame={handleLeavePlayerGame}
        countdown={countdown}
      />
    );
  }

  return (
    <LandingPage
      onCreateGame={handleCreateGame}
      onJoinGame={handleJoinGame}
      isCreating={isCreating}
    />
  );
};
export default App;

