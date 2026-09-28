import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Timer } from '../components/Timer';
import { DragDropArea } from '../components/DragDropArea';
import { AudioToggle } from '../components/AudioToggle';
import { PlayerGameState } from '../types';
import {
  Users,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Send,
  Hourglass,
  Trophy,
  Target,
  ArrowLeft,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface PlayerGameViewProps {
  state: PlayerGameState;
  connectedPlayers: Array<{ id: string; name: string; isConnected: boolean }>;
  onSubmitAnswers: (answers: Record<string, string>) => void;
  onSubmitQuizAnswer?: (selectedOption: string) => void;
  onLeaveGame: () => void;
  countdown?: number | null;
}

export const PlayerGameView: React.FC<PlayerGameViewProps> = ({
  state,
  connectedPlayers,
  onSubmitAnswers,
  onSubmitQuizAnswer,
  onLeaveGame,
  countdown = null,
}) => {
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);

  // Reset placements when round changes
  useEffect(() => {
    setPlacements({});
  }, [state.currentRoundIndex]);

  // Reset quiz selection when quiz question changes or when entering a new question
  useEffect(() => {
    if (!state.playerQuizSubmitted) {
      setSelectedQuizOption(null);
    } else if (state.playerSelectedOption) {
      setSelectedQuizOption(state.playerSelectedOption);
    }
  }, [
    state.currentQuizIndex,
    state.currentQuizQuestionIndex,
    state.currentQuizQuestion?.id,
    state.status,
    state.playerQuizSubmitted,
    state.playerSelectedOption,
  ]);


  // Trigger celebration confetti on game or quiz completion
  useEffect(() => {
    if (state.status === 'GAME_COMPLETED' || state.status === 'QUIZ_COMPLETED') {
      sounds.playFanfare();
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#8b5cf6', '#10b981', '#f59e0b'],
      });
    }
  }, [state.status]);

  // Sound effect when round completes
  useEffect(() => {
    if (state.status === 'ROUND_COMPLETED' && state.lastRoundResult) {
      if (state.lastRoundResult.correctCount > 0) {
        sounds.playSuccess();
      } else {
        sounds.playError();
      }
    }
  }, [state.status, state.lastRoundResult]);

  // Sound effect when quiz round completes
  useEffect(() => {
    if (state.status === 'QUIZ_ROUND_COMPLETED' && state.lastQuizResult) {
      if (state.lastQuizResult.isCorrect) {
        sounds.playSuccess();
      } else {
        sounds.playError();
      }
    }
  }, [state.status, state.lastQuizResult]);

  // Auto-submit placed items if time runs out for categorization
  useEffect(() => {
    if (
      state.status === 'PLAYING' &&
      state.timeRemainingSeconds === 0 &&
      !state.playerRoundSubmitted
    ) {
      onSubmitAnswers(placements);
    }
  }, [state.status, state.timeRemainingSeconds, state.playerRoundSubmitted, placements, onSubmitAnswers]);

  const handleSubmit = () => {
    sounds.playClick();
    onSubmitAnswers(placements);
  };

  const handleSelectQuizOption = (option: string) => {
    if (state.playerQuizSubmitted || selectedQuizOption || state.isPaused) return;
    sounds.playClick();
    setSelectedQuizOption(option);
    if (onSubmitQuizAnswer) {
      onSubmitQuizAnswer(option);
    }
  };


  // 1. WAITING ROOM VIEW
  if (state.status === 'WAITING') {
    const activePlayersList =
      connectedPlayers && connectedPlayers.length > 0
        ? connectedPlayers
        : (state.connectedPlayers || []);

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'var(--bg-main)',
        }}
      >
        <Card style={{ maxWidth: '520px', width: '100%', textAlign: 'center', padding: '36px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={onLeaveGame}>
              Leave
            </Button>
            <AudioToggle />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <img
              src="/aifc-logo.png"
              alt="AI FRONTIER CLUB"
              className="header-logo-img"
              style={{ width: '64px', height: '64px', objectFit: 'contain' }}
            />
          </div>

          <span className="badge badge-indigo" style={{ marginBottom: '12px' }}>
            AI FRONTIER CLUB ARENA
          </span>

          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Room Code:
          </h2>
          <div
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '3rem',
              fontWeight: 800,
              color: 'var(--primary)',
              letterSpacing: '0.08em',
              margin: '6px 0 20px',
            }}
          >
            #{state.roomCode}
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                Players Joined ({activePlayersList.length})
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                You: <strong style={{ color: 'var(--text-main)' }}>{state.playerName}</strong>
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                justifyContent: 'center',
                maxHeight: '180px',
                overflowY: 'auto',
              }}
            >
              {activePlayersList.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: p.name === state.playerName ? 'var(--primary-light)' : '#ffffff',
                    border: '1px solid',
                    borderColor: p.name === state.playerName ? 'var(--primary-border)' : 'var(--border-subtle)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: p.name === state.playerName ? 'var(--primary)' : 'var(--text-main)',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: p.isConnected ? 'var(--success)' : 'var(--text-subtle)',
                    }}
                  />
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Animated Waiting indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: 'var(--text-muted)',
              fontSize: '0.94rem',
              fontWeight: 500,
            }}
          >
            <Hourglass size={18} color="var(--primary)" className="animate-pulse-warning" />
            <span>Waiting for host to start the game...</span>
          </div>
        </Card>
      </div>
    );
  }

  // 2. STARTING COUNTDOWN OVERLAY
  if (state.status === 'STARTING' || state.status === 'QUIZ_STARTING') {
    const isQuiz = state.status === 'QUIZ_STARTING';
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-main)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <span className="badge badge-indigo" style={{ fontSize: '0.95rem', padding: '6px 16px' }}>
            {isQuiz ? 'QUIZ PHASE STARTING!' : 'GET READY!'}
          </span>
          <h2
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '6rem',
              fontWeight: 900,
              color: 'var(--primary)',
              margin: '20px 0',
              lineHeight: 1,
            }}
            className="animate-success"
          >
            {countdown !== null ? countdown : '3'}
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>
            {isQuiz
              ? 'Inspect the image and choose the correct category fast for max speed points!'
              : 'Categorize items quickly to earn top speed points!'}
          </p>
        </div>
      </div>
    );
  }

  // 3. QUIZ ROUND COMPLETED SCREEN
  if (state.status === 'QUIZ_ROUND_COMPLETED') {
    const result = state.lastQuizResult;
    const isSubmitted = state.playerQuizSubmitted || selectedQuizOption !== null;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'var(--bg-main)',
        }}
      >
        <Card style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={onLeaveGame}>
              Leave
            </Button>
            <AudioToggle />
          </div>

          <span className="badge badge-purple" style={{ marginBottom: '12px' }}>
            Quiz Question {(state.currentQuizQuestionIndex ?? state.currentQuizIndex ?? 0) + 1} of {state.totalQuizQuestions || '?'} Complete
          </span>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
            {result?.isCorrect ? 'Correct Answer! 🎉' : isSubmitted ? 'Incorrect Option ❌' : 'Time Up! ⌛'}
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            {result?.isCorrect
              ? 'Great job! You identified the correct category quickly.'
              : 'Keep going! More questions coming up next.'}
          </p>

          {result && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: result.isCorrect ? 'var(--success-light)' : 'var(--error-light)',
                  border: `1px solid ${result.isCorrect ? 'var(--success-border)' : 'var(--error-border)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: result.isCorrect ? 'var(--success)' : 'var(--error)' }}>
                  {result.isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Result
                  </span>
                </div>
                <strong style={{ fontSize: '1.4rem', color: result.isCorrect ? 'var(--success)' : 'var(--error)', fontFamily: 'Outfit, sans-serif' }}>
                  {result.isCorrect ? 'Correct' : 'Wrong'}
                </strong>
              </div>

              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-light)',
                  border: '1px solid var(--primary-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--primary)' }}>
                  <Award size={16} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Points
                  </span>
                </div>
                <strong style={{ fontSize: '1.5rem', color: 'var(--primary)', fontFamily: 'Outfit, sans-serif' }}>
                  +{result.scoreAwarded}
                </strong>
              </div>

              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  gridColumn: '1 / -1',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                  <Clock size={16} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Time Taken
                  </span>
                </div>
                <strong style={{ fontSize: '1.4rem', color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>
                  {((result.completionTimeMs ?? 0) / 1000).toFixed(1)}s
                </strong>
              </div>
            </div>
          )}

          {/* Cumulative Total Score */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '2px solid var(--border-subtle)',
              borderBottom: '3px solid #cbd5e1',
              marginBottom: '20px',
            }}
          >
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Your Cumulative Total Score
            </span>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '2.4rem',
                fontWeight: 800,
                color: 'var(--primary)',
                marginTop: '4px',
              }}
            >
              {state.playerScore.toLocaleString()}
            </div>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Hourglass size={16} color="var(--primary)" className="animate-pulse-warning" />
            Waiting for host to proceed...
          </p>
        </Card>
      </div>
    );
  }

  // 4. ROUND COMPLETED SCREEN (INTERMISSION FOR CATEGORIZATION)
  if (state.status === 'ROUND_COMPLETED') {
    const result = state.lastRoundResult;
    const isSubmitted = state.playerRoundSubmitted;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'var(--bg-main)',
        }}
      >
        <Card style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={onLeaveGame}>
              Leave
            </Button>
            <AudioToggle />
          </div>

          <span className="badge badge-purple" style={{ marginBottom: '12px' }}>
            Round {state.currentRoundIndex + 1} of {state.totalRounds} Complete
          </span>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
            {isSubmitted ? 'Round Results' : 'Time Up!'}
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Here is your personal performance breakdown for this round.
          </p>

          {result && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--success-light)',
                  border: '1px solid var(--success-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--success)' }}>
                  <CheckCircle2 size={18} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Correct
                  </span>
                </div>
                <strong style={{ fontSize: '1.8rem', color: 'var(--success)', fontFamily: 'Outfit, sans-serif' }}>
                  {result.correctCount}
                </strong>
              </div>

              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--error-light)',
                  border: '1px solid var(--error-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--error)' }}>
                  <XCircle size={18} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Wrong
                  </span>
                </div>
                <strong style={{ fontSize: '1.8rem', color: 'var(--error)', fontFamily: 'Outfit, sans-serif' }}>
                  {result.wrongCount}
                </strong>
              </div>

              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                  <Clock size={16} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Speed
                  </span>
                </div>
                <strong style={{ fontSize: '1.5rem', color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>
                  {(result.completionTimeMs / 1000).toFixed(1)}s
                </strong>
              </div>

              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-light)',
                  border: '1px solid var(--primary-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--primary)' }}>
                  <Award size={16} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Round Points
                  </span>
                </div>
                <strong style={{ fontSize: '1.5rem', color: 'var(--primary)', fontFamily: 'Outfit, sans-serif' }}>
                  +{result.scoreAwarded}
                </strong>
              </div>
            </div>
          )}

          {/* Total Score display */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '2px solid var(--border-subtle)',
              borderBottom: '3px solid #cbd5e1',
              marginBottom: '20px',
            }}
          >
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Your Cumulative Total Score
            </span>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '2.4rem',
                fontWeight: 800,
                color: 'var(--primary)',
                marginTop: '4px',
              }}
            >
              {state.playerScore.toLocaleString()}
            </div>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Hourglass size={16} color="var(--primary)" className="animate-pulse-warning" />
            Waiting for host to begin the next round...
          </p>
        </Card>
      </div>
    );
  }

  // 5. FINAL GAME OVER & PERSONAL RESULTS
  if (state.status === 'GAME_COMPLETED' || state.status === 'QUIZ_COMPLETED') {
    const isQuiz = state.status === 'QUIZ_COMPLETED';
    const stats = state.finalStats;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 20px',
          background: 'transparent',
          position: 'relative',
          overflowX: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '36px',
            maxWidth: '1140px',
            width: '100%',
            flexWrap: 'wrap-reverse',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Main Score & Report Card */}
          <Card
            style={{
              flex: '1 1 520px',
              maxWidth: '580px',
              width: '100%',
              textAlign: 'center',
              padding: '36px',
              position: 'relative',
              zIndex: 3,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <AudioToggle />
            </div>

            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 4px 16px rgba(79, 70, 229, 0.18)',
              }}
            >
              <Trophy size={32} />
            </div>

            <span className="badge badge-green" style={{ marginBottom: '8px' }}>
              GAME COMPLETED
            </span>

            <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Great Job, {state.playerName}!
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Here is your final performance report across all rounds.
            </p>

            {/* Big Score Card */}
            <div
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, rgba(238, 242, 255, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%)',
                border: '2px solid rgba(199, 210, 254, 0.9)',
                borderBottom: '4px solid #a5b4fc',
                boxShadow: '0 10px 24px -4px rgba(79, 70, 229, 0.12)',
                marginBottom: '24px',
              }}
            >
              <span style={{ fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em' }}>
                Final Total Score
              </span>
              <div
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '3.6rem',
                  fontWeight: 900,
                  color: 'var(--primary)',
                  lineHeight: 1.1,
                  margin: '8px 0',
                }}
              >
                {state.playerScore.toLocaleString()}
              </div>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Accuracy & Speed Points Combined
              </span>
            </div>

            {/* Personal Performance Stats Grid */}
            {stats && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))',
                  gap: '12px',
                  marginBottom: '28px',
                }}
              >
                <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.9)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Correct
                  </span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)', fontFamily: 'Outfit, sans-serif', marginTop: '4px' }}>
                    {stats.totalCorrect}
                  </div>
                </div>

                <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.9)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Wrong
                  </span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--error)', fontFamily: 'Outfit, sans-serif', marginTop: '4px' }}>
                    {stats.totalWrong}
                  </div>
                </div>

                <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.9)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Accuracy
                  </span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'Outfit, sans-serif', marginTop: '4px' }}>
                    {stats.accuracyPercent}%
                  </div>
                </div>

                <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.9)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Total Time
                  </span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif', marginTop: '4px' }}>
                    {stats.totalTimeSeconds}s
                  </div>
                </div>
              </div>
            )}

            {/* HOST-REVEALED FINAL LEADERBOARD (IF ENABLED BY HOST) */}
            {state.finalLeaderboard && state.finalLeaderboard.length > 0 && (
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '20px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.8)',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Trophy size={18} color="var(--primary)" />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Final Leaderboard</h4>
                  <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
                    Revealed by Host
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {state.finalLeaderboard.map((entry: any) => {
                    const isMe = entry.name === state.playerName;
                    return (
                      <div
                        key={entry.rank}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: isMe ? 'var(--primary-light)' : 'rgba(255, 255, 255, 0.7)',
                          border: '1px solid',
                          borderColor: isMe ? 'var(--primary-border)' : 'rgba(255, 255, 255, 0.85)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: entry.rank === 1 ? '#fef3c7' : 'rgba(255, 255, 255, 0.9)',
                              color: entry.rank === 1 ? '#b45309' : 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                            }}
                          >
                            {entry.rank}
                          </span>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            {entry.name} {isMe && <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>(You)</span>}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                            {entry.accuracyPercent}% Acc
                          </span>
                          <span style={{ fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'var(--primary)' }}>
                            {entry.score.toLocaleString()} pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ marginTop: '24px' }}>
              <Button variant="secondary" size="md" onClick={onLeaveGame}>
                Return to Home
              </Button>
            </div>
          </Card>

          {/* Right Side: 3D Robot Character */}
          <div
            style={{
              flex: '1 1 320px',
              maxWidth: '380px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              animation: 'aifc-float 5s ease-in-out infinite',
            }}
          >
            {/* Ambient Neon Glow */}
            <div
              className="aifc-glow-orb"
              style={{
                top: '15%',
                left: '10%',
                width: '280px',
                height: '280px',
                background: 'radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(79, 70, 229, 0) 70%)',
              }}
            />

            {/* Floating Champion Badge */}
            <div
              className="aifc-floating-card"
              style={{
                position: 'absolute',
                top: '10px',
                right: '0px',
                animation: 'aifc-float-medium 4s infinite ease-in-out',
                zIndex: 10,
              }}
              onClick={() => sounds.playPop()}
            >
              <Sparkles size={16} color="#06b6d4" />
              <span>Champion Finish!</span>
            </div>

            <img
              src="/aifc-robot.png"
              alt="AI FRONTIER CLUB Robot Champion"
              style={{
                width: '100%',
                maxWidth: '350px',
                height: 'auto',
                maxHeight: '520px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 20px 30px rgba(15, 23, 42, 0.15)) drop-shadow(0 0 35px rgba(6, 182, 212, 0.25))',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* Fixed Footer Branding */}
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 20px',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.25)',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '0.82rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              background: 'linear-gradient(135deg, #020324ff, #06b6d4, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Designed & Developed by Ragul
          </span>
        </div>
      </div>
    );
  }

  // 6. ACTIVE QUIZ QUESTION SCREEN (QUIZ GAMEPLAY)
  if (state.status === 'QUIZ_PLAYING') {
    const quizQ = state.currentQuizQuestion;
    const currentSelected = selectedQuizOption || state.playerSelectedOption || null;
    const isLocked = state.playerQuizSubmitted || selectedQuizOption !== null;

    if (!quizQ) {
      return (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading quiz question...
        </div>
      );
    }

    return (
      <div style={{ minHeight: '100vh', background: 'transparent', paddingBottom: '60px' }}>
        {/* Top Gameplay Bar */}
        <header
          style={{
            background: 'rgba(255, 255, 255, 0.45)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.75)',
            padding: '14px 24px',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <div
            style={{
              maxWidth: '1000px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {/* Left: Player Info & Quiz Question Index */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src="/aifc-logo.png"
                alt="AI FRONTIER CLUB"
                className="header-logo-img"
                style={{ width: '32px', height: '32px', objectFit: 'contain' }}
              />
              <span
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 800,
                  fontSize: '1rem',
                  color: 'var(--text-main)',
                }}
              >
                {state.playerName}
              </span>
              <span className="badge badge-indigo">
                Quiz Question {(state.currentQuizQuestionIndex ?? state.currentQuizIndex ?? 0) + 1} of {state.totalQuizQuestions || '?'}
              </span>
            </div>

            {/* Center: Timer */}
            <Timer
              seconds={state.timeRemainingSeconds}
              totalSeconds={quizQ.timeLimitSeconds || 15}
              isPaused={state.isPaused}
            />

            {/* Right: Own Score (Player Privacy: only own score is visible) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--primary-light)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--primary-border)',
                }}
              >
                <Award size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                  Score:
                </span>
                <strong
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '1.05rem',
                    color: 'var(--primary)',
                  }}
                >
                  {state.playerScore.toLocaleString()}
                </strong>
              </div>

              <AudioToggle />
            </div>
          </div>
        </header>

        {/* Main Quiz Content */}
        <main
          style={{
            maxWidth: '860px',
            margin: '28px auto 0',
            padding: '0 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          {/* Question Image Card */}
          <Card
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '28px 24px',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--primary)',
                letterSpacing: '0.05em',
                marginBottom: '6px',
              }}
            >
              Which category does this belong to?
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '20px' }}>
              {quizQ.questionText || quizQ.text || 'Select the correct category below'}
            </h2>

            {quizQ.imageUrl && (
              <div
                style={{
                  width: '100%',
                  maxWidth: '380px',
                  height: '240px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'rgba(241, 245, 249, 0.9)',
                  border: '2px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08)',
                  padding: '12px',
                }}
              >
                <img
                  src={quizQ.imageUrl}
                  alt="Quiz target"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
                />
              </div>
            )}
          </Card>

          {/* Options Grid (4 or 5 options) */}
          <div
            style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: quizQ.options.length === 5 ? 'repeat(auto-fit, minmax(220px, 1fr))' : 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
            }}
          >
            {quizQ.options.map((option: string, idx: number) => {
              const isSelected = currentSelected === option;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectQuizOption(option)}
                  disabled={isLocked || state.isPaused || state.timeRemainingSeconds === 0}
                  className="card-3d"
                  style={{
                    padding: '20px 24px',
                    borderRadius: '16px',
                    border: '2px solid',
                    borderColor: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.8)',
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(139, 92, 246, 0.22) 100%)'
                      : 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(12px)',
                    cursor: isLocked ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    boxShadow: isSelected
                      ? '0 8px 20px rgba(99, 102, 241, 0.25)'
                      : '0 4px 12px rgba(15, 23, 42, 0.05)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: isLocked && !isSelected ? 0.6 : 1,
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                      textAlign: 'left',
                    }}
                  >
                    {option}
                  </span>

                  {isSelected && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        color: '#fff',
                        fontWeight: 800,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Locked / Status Banner */}
          {isLocked && currentSelected && (
            <div
              className="animate-fade-in card-3d"
              style={{
                padding: '14px 28px',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '0.95rem',
              }}
            >
              <CheckCircle2 size={20} color="var(--primary)" />
              <span>Answer locked ({currentSelected})! Waiting for question timer to complete...</span>
            </div>
          )}
        </main>
      </div>
    );
  }

  // 7. ACTIVE CATEGORIZATION QUESTION SCREEN (GAMEPLAY)
  const question = state.currentQuestion;
  if (!question) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading round data...
      </div>
    );
  }

  const allItemsPlaced = Object.keys(placements).length === question.items.length;

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', paddingBottom: '60px' }}>
      {/* Top Gameplay Bar */}
      <header
        style={{
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.75)',
          padding: '14px 24px',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Left: Player Info & Round */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/aifc-logo.png"
              alt="AI FRONTIER CLUB"
              className="header-logo-img"
              style={{ width: '32px', height: '32px', objectFit: 'contain' }}
            />
            <span
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 800,
                fontSize: '1rem',
                color: 'var(--text-main)',
              }}
            >
              {state.playerName}
            </span>
            <span className="badge badge-indigo">
              Round {state.currentRoundIndex + 1} of {state.totalRounds}
            </span>
          </div>

          {/* Center: Live Timer */}
          <Timer
            seconds={state.timeRemainingSeconds}
            totalSeconds={question.timeLimitSeconds}
            isPaused={state.isPaused}
          />

          {/* Right: Own Score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--primary-light)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--primary-border)',
              }}
            >
              <Award size={16} color="var(--primary)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                Score:
              </span>
              <strong
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '1.05rem',
                  color: 'var(--primary)',
                }}
              >
                {state.playerScore.toLocaleString()}
              </strong>
            </div>

            <AudioToggle />
          </div>
        </div>
      </header>

      {/* Main Game Screen Content */}
      <main
        style={{
          maxWidth: '1200px',
          margin: '24px auto 0',
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Question Title Card */}
        <Card style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Categorization Challenge
          </span>
          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginTop: '4px',
              lineHeight: 1.3,
            }}
          >
            {question.title}
          </h2>
        </Card>

        {/* Drag & Drop Area (Categories and Item Deck) */}
        <DragDropArea
          categories={question.categories}
          items={question.items}
          itemPlacements={placements}
          onPlacementChange={setPlacements}
          disabled={state.playerRoundSubmitted || state.isPaused}
        />

        {/* Bottom Submission Action Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'var(--bg-surface)',
            padding: '16px 24px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--border-subtle)',
            borderBottom: '3px solid #cbd5e1',
          }}
        >
          <div>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Status:{' '}
              {state.playerRoundSubmitted ? (
                <strong style={{ color: 'var(--success)' }}>Submitted! Waiting for round end.</strong>
              ) : allItemsPlaced ? (
                <strong style={{ color: 'var(--primary)' }}>Ready to submit!</strong>
              ) : (
                <span>Place all items into categories to complete the question.</span>
              )}
            </span>
          </div>

          <Button
            variant="primary"
            size="lg"
            icon={<Send size={18} />}
            onClick={handleSubmit}
            disabled={state.playerRoundSubmitted || state.isPaused || Object.keys(placements).length === 0}
          >
            {state.playerRoundSubmitted ? 'Answers Submitted' : 'Submit Answers'}
          </Button>
        </div>
      </main>
    </div>
  );
};
