import React, { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Timer } from '../components/Timer';
import { QuestionCard } from '../components/QuestionCard';
import { QuestionEditor } from '../components/QuestionEditor';
import { QuizQuestionCard } from '../components/QuizQuestionCard';
import { QuizQuestionEditor } from '../components/QuizQuestionEditor';
import { LiveScoreboard } from '../components/LiveScoreboard';
import { AudioToggle } from '../components/AudioToggle';
import { HostDashboardState, Question, QuizQuestion } from '../types';
import {
  Play,
  Pause,
  SkipForward,
  StopCircle,
  Plus,
  Shuffle,
  Copy,
  Check,
  RotateCcw,
  Eye,
  EyeOff,
  Users,
  Clock,
  HelpCircle,
  Sparkles,
  ArrowLeft,
  HelpCircle as QuizIcon,
  Layers,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface HostDashboardProps {
  state: HostDashboardState;
  questions: Question[];
  quizQuestions?: QuizQuestion[];
  onStartGame: () => void;
  onPauseGame: () => void;
  onResumeGame: () => void;
  onNextRound: () => void;
  onEndGame: () => void;
  onStartQuiz?: () => void;
  onNextQuizQuestion?: () => void;
  onEndQuiz?: () => void;
  onToggleRevealLeaderboard: (reveal: boolean) => void;
  onSaveQuestion: (question: Partial<Question>) => void;
  onMoveQuestion?: (index: number, direction: 'up' | 'down') => void;
  onShuffleQuestionItems?: (questionId: string) => void;
  onDeleteQuestion: (id: string) => void;
  onDuplicateQuestion: (id: string) => void;
  onRandomizeQuestions: () => void;
  onResetSeedQuestions: () => void;
  onSaveQuizQuestion?: (quizQuestion: Partial<QuizQuestion>) => void;
  onDeleteQuizQuestion?: (id: string) => void;
  onResetSeedQuizQuestions?: () => void;
  onLeaveDashboard: () => void;
  onKickPlayer?: (playerId: string) => void;
  countdown?: number | null;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({
  state,
  questions,
  quizQuestions = [],
  onStartGame,
  onPauseGame,
  onResumeGame,
  onNextRound,
  onEndGame,
  onStartQuiz,
  onNextQuizQuestion,
  onEndQuiz,
  onToggleRevealLeaderboard,
  onSaveQuestion,
  onMoveQuestion,
  onShuffleQuestionItems,
  onDeleteQuestion,
  onDuplicateQuestion,
  onRandomizeQuestions,
  onResetSeedQuestions,
  onSaveQuizQuestion,
  onDeleteQuizQuestion,
  onResetSeedQuizQuestions,
  onLeaveDashboard,
  onKickPlayer,
  countdown = null,
}) => {
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuizQuestion, setEditingQuizQuestion] = useState<QuizQuestion | null>(null);
  const [isQuizEditorOpen, setIsQuizEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'categorize' | 'quiz'>('categorize');
  const [copiedCode, setCopiedCode] = useState(false);
  const [quizAlert, setQuizAlert] = useState<string | null>(null);

  const handleCopyCode = () => {
    sounds.playClick();
    navigator.clipboard.writeText(state.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleStartQuizClick = () => {
    if (!quizQuestions || quizQuestions.length === 0) {
      setQuizAlert('Add at least one quiz question before starting the quiz.');
      setTimeout(() => setQuizAlert(null), 4000);
      return;
    }
    setQuizAlert(null);
    if (onStartQuiz) {
      onStartQuiz();
    }
  };

  const isGameActive = state.status === 'PLAYING' || state.status === 'STARTING';
  const isRoundComplete = state.status === 'ROUND_COMPLETED';
  const isGameOver = state.status === 'GAME_COMPLETED';
  const isWaiting = state.status === 'WAITING';

  const isQuizStarting = state.status === 'QUIZ_STARTING';
  const isQuizPlaying = state.status === 'QUIZ_PLAYING';
  const isQuizActive = isQuizStarting || isQuizPlaying;
  const isQuizRoundComplete = state.status === 'QUIZ_ROUND_COMPLETED';
  const isQuizOver = state.status === 'QUIZ_COMPLETED';

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', paddingBottom: '60px' }}>
      {/* Top Navbar */}
      <header
        style={{
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.75)',
          padding: '16px 28px',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: '1360px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowLeft size={16} />}
              onClick={onLeaveDashboard}
            >
              Exit
            </Button>
            <img
              src="/aifc-logo.png"
              alt="AI FRONTIER CLUB"
              className="header-logo-img"
              style={{
                width: '38px',
                height: '38px',
                objectFit: 'contain',
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{state.title}</h2>
                <span className="badge badge-indigo">HOST</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                AI FRONTIER CLUB • Host Game Console
              </span>
            </div>
          </div>

          {/* Room Code Badge with Copy button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              onClick={handleCopyCode}
              className="card-3d"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 14px',
                cursor: 'pointer',
                background: 'var(--primary-light)',
                borderColor: 'var(--primary-border)',
              }}
              title="Click to copy Room Code"
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                GAME ID:
              </span>
              <span
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: 'var(--primary)',
                }}
              >
                #{state.roomCode}
              </span>
              {copiedCode ? (
                <Check size={16} color="var(--success)" />
              ) : (
                <Copy size={16} color="var(--primary)" />
              )}
            </div>

            <AudioToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        style={{
          maxWidth: '1360px',
          margin: '28px auto 0',
          padding: '0 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
        }}
      >
        {/* Alert message if Quiz empty */}
        {quizAlert && (
          <div
            className="animate-fade-in card-3d"
            style={{
              padding: '14px 20px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '12px',
              color: '#dc2626',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span>⚠️ {quizAlert}</span>
          </div>
        )}

        {/* TOP STATUS & CONTROL BAR */}
        <Card>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '20px',
            }}
          >
            {/* Quick Metrics */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Game Status
                </span>
                <div style={{ marginTop: '2px' }}>
                  {state.status === 'WAITING' && <span className="badge badge-amber">Waiting for Players</span>}
                  {state.status === 'STARTING' && <span className="badge badge-indigo">Starting Categorization...</span>}
                  {state.status === 'PLAYING' && <span className="badge badge-green">Categorization in Progress</span>}
                  {state.status === 'ROUND_COMPLETED' && <span className="badge badge-purple">Round Finished</span>}
                  {state.status === 'GAME_COMPLETED' && <span className="badge badge-rose">Categorization Completed</span>}
                  {state.status === 'QUIZ_STARTING' && <span className="badge badge-indigo">Starting Quiz...</span>}
                  {state.status === 'QUIZ_PLAYING' && <span className="badge badge-green">Quiz in Progress</span>}
                  {state.status === 'QUIZ_ROUND_COMPLETED' && <span className="badge badge-purple">Quiz Question Done</span>}
                  {state.status === 'QUIZ_COMPLETED' && <span className="badge badge-rose">Quiz Completed</span>}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Connected Players
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <Users size={16} color="var(--primary)" />
                  <strong style={{ fontSize: '1.2rem', fontFamily: 'Outfit, sans-serif' }}>
                    {state.connectedPlayersCount}
                  </strong>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {isQuizActive || isQuizRoundComplete || isQuizOver ? 'Quiz Question' : 'Round'}
                </span>
                <div style={{ marginTop: '2px' }}>
                  <strong style={{ fontSize: '1.2rem', fontFamily: 'Outfit, sans-serif' }}>
                    {isQuizActive || isQuizRoundComplete || isQuizOver
                      ? `${(state.currentQuizQuestionIndex ?? 0) + 1} / ${state.totalQuizQuestions || quizQuestions.length}`
                      : `${state.currentRoundIndex + 1} / ${state.totalRounds || questions.length}`}
                  </strong>
                </div>
              </div>

              {/* Live Timer if Playing */}
              {(state.status === 'PLAYING' || state.status === 'QUIZ_PLAYING') && (
                <Timer
                  seconds={state.timeRemainingSeconds}
                  totalSeconds={
                    state.status === 'QUIZ_PLAYING'
                      ? state.currentQuizQuestion?.timeLimitSeconds || 15
                      : state.currentQuestion?.timeLimitSeconds || 30
                  }
                  isPaused={state.isPaused}
                />
              )}

              {/* Countdown indicator during Starting */}
              {(state.status === 'STARTING' || state.status === 'QUIZ_STARTING') && (
                <div
                  className="card-3d animate-pulse-warning"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: 'var(--primary-light)',
                    borderColor: 'var(--primary-border)',
                  }}
                >
                  <Clock size={16} color="var(--primary)" />
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'Outfit, sans-serif' }}>
                    Starting in {countdown !== null && countdown !== undefined ? `${countdown}s` : '3s'}...
                  </span>
                </div>
              )}
            </div>

            {/* Host Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              {(isWaiting || isGameOver) && (
                <>
                  <Button
                    variant="primary"
                    size="md"
                    icon={<Play size={18} />}
                    onClick={onStartGame}
                    disabled={questions.length === 0}
                  >
                    {isGameOver ? 'Replay Categorization' : 'Start Categorization'}
                  </Button>

                  <Button
                    variant="primary"
                    size="md"
                    icon={<Sparkles size={18} />}
                    onClick={handleStartQuizClick}
                    style={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
                      color: '#ffffff',
                      boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                    }}
                  >
                    START QUIZ
                  </Button>
                </>
              )}

              {/* Categorization in progress */}
              {state.status === 'PLAYING' && (
                <>
                  {state.isPaused ? (
                    <Button variant="primary" size="md" icon={<Play size={16} />} onClick={onResumeGame}>
                      Resume
                    </Button>
                  ) : (
                    <Button variant="secondary" size="md" icon={<Pause size={16} />} onClick={onPauseGame}>
                      Pause
                    </Button>
                  )}
                  <Button variant="danger" size="md" icon={<StopCircle size={16} />} onClick={onEndGame}>
                    End Game
                  </Button>
                </>
              )}

              {/* Categorization round completed */}
              {isRoundComplete && (
                <>
                  <Button
                    variant="primary"
                    size="md"
                    icon={<SkipForward size={18} />}
                    onClick={onNextRound}
                  >
                    {state.currentRoundIndex + 1 >= state.totalRounds ? 'Finish Categorization' : 'Next Round'}
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    icon={<Sparkles size={16} />}
                    onClick={handleStartQuizClick}
                  >
                    START QUIZ
                  </Button>
                  <Button variant="secondary" size="md" icon={<StopCircle size={16} />} onClick={onEndGame}>
                    End Now
                  </Button>
                </>
              )}

              {/* Quiz in progress */}
              {state.status === 'QUIZ_PLAYING' && (
                <>
                  {state.isPaused ? (
                    <Button variant="primary" size="md" icon={<Play size={16} />} onClick={onResumeGame}>
                      Resume Quiz
                    </Button>
                  ) : (
                    <Button variant="secondary" size="md" icon={<Pause size={16} />} onClick={onPauseGame}>
                      Pause
                    </Button>
                  )}
                  <Button variant="danger" size="md" icon={<StopCircle size={16} />} onClick={onEndQuiz || onEndGame}>
                    End Quiz
                  </Button>
                </>
              )}

              {/* Quiz question completed */}
              {isQuizRoundComplete && (
                <>
                  <Button
                    variant="primary"
                    size="md"
                    icon={<SkipForward size={18} />}
                    onClick={onNextQuizQuestion}
                  >
                    {(state.currentQuizQuestionIndex ?? 0) + 1 >= (state.totalQuizQuestions || quizQuestions.length)
                      ? 'Finish Quiz'
                      : 'Next Question'}
                  </Button>
                  <Button variant="secondary" size="md" icon={<StopCircle size={16} />} onClick={onEndQuiz || onEndGame}>
                    End Quiz
                  </Button>
                </>
              )}

              {/* Game or Quiz completed: Leaderboard reveal toggle */}
              {(isGameOver || isQuizOver) && (
                <Button
                  variant={state.revealLeaderboard ? 'primary' : 'secondary'}
                  size="md"
                  icon={state.revealLeaderboard ? <EyeOff size={16} /> : <Eye size={16} />}
                  onClick={() => onToggleRevealLeaderboard(!state.revealLeaderboard)}
                >
                  {state.revealLeaderboard ? 'Leaderboard Revealed' : 'Reveal Leaderboard to Players'}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* ACTIVE CATEGORIZATION BANNER */}
        {isGameActive && state.currentQuestion && (
          <Card style={{ background: 'var(--primary-light)', borderColor: 'var(--primary-border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-indigo">Active Categorization Round</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Round {state.currentRoundIndex + 1} of {state.totalRounds}
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {state.currentQuestion.title}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                {state.currentQuestion.categories.map((c) => (
                  <span key={c.id} className="badge badge-purple">
                    {c.name}
                  </span>
                ))}
                <span className="badge badge-gray">
                  {state.currentQuestion.items.length} Items Total
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* ACTIVE QUIZ QUESTION BANNER */}
        {(isQuizActive || isQuizRoundComplete) && state.currentQuizQuestion && (
          <Card style={{ background: 'rgba(99, 102, 241, 0.08)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              {state.currentQuizQuestion.imageUrl && (
                <img
                  src={state.currentQuizQuestion.imageUrl}
                  alt="Quiz"
                  style={{
                    width: '90px',
                    height: '90px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    border: '2px solid rgba(99, 102, 241, 0.3)',
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="badge badge-indigo">Active Quiz Question</span>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    Question {(state.currentQuizQuestionIndex ?? 0) + 1} of {state.totalQuizQuestions || quizQuestions.length}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  {state.currentQuizQuestion.questionText || state.currentQuizQuestion.text || 'Select the correct category'}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {state.currentQuizQuestion.options.map((opt, i) => (
                    <span
                      key={i}
                      className={opt === state.currentQuizQuestion?.correctOption ? 'badge badge-green' : 'badge badge-gray'}
                    >
                      {opt} {opt === state.currentQuizQuestion?.correctOption && '✓'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* LIVE SCOREBOARD */}
        <Card>
          <LiveScoreboard
            players={state.livePlayers}
            currentRoundIndex={state.currentRoundIndex}
            onKickPlayer={onKickPlayer}
          />
        </Card>

        {/* QUESTION MANAGER (EDIT/ADD QUESTIONS) */}
        <Card>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Question Manager</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Manage rounds and quiz questions for this game room.
              </p>
            </div>

            {/* Tab selection */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.6)',
                borderRadius: '10px',
                padding: '4px',
                border: '1px solid var(--border-subtle)',
                gap: '4px',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('categorize')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'categorize' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'categorize' ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Layers size={14} />
                Categorization ({questions.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('quiz')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'quiz' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'quiz' ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                <QuizIcon size={14} />
                Quiz ({quizQuestions.length})
              </button>
            </div>

            {/* Action buttons based on active tab */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {activeTab === 'categorize' ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Shuffle size={14} />}
                    onClick={onRandomizeQuestions}
                    disabled={isGameActive || isQuizActive}
                    title="Randomize question sequence"
                  >
                    Randomize
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<RotateCcw size={14} />}
                    onClick={onResetSeedQuestions}
                    disabled={isGameActive || isQuizActive}
                    title="Restore default question set"
                  >
                    Reset Seeds
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus size={16} />}
                    onClick={() => {
                      setEditingQuestion(null);
                      setIsEditorOpen(true);
                    }}
                    disabled={isGameActive || isQuizActive}
                  >
                    Add Categorization
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<RotateCcw size={14} />}
                    onClick={onResetSeedQuizQuestions}
                    disabled={isGameActive || isQuizActive}
                    title="Restore default quiz questions"
                  >
                    Reset Seeds
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus size={16} />}
                    onClick={() => {
                      setEditingQuizQuestion(null);
                      setIsQuizEditorOpen(true);
                    }}
                    disabled={isGameActive || isQuizActive}
                  >
                    Add Quiz Question
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Categorization Questions List */}
          {activeTab === 'categorize' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '16px',
              }}
            >
              {questions.map((q, idx) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={idx}
                  canMoveUp={idx > 0}
                  canMoveDown={idx < questions.length - 1}
                  onMoveUp={() => onMoveQuestion && onMoveQuestion(idx, 'up')}
                  onMoveDown={() => onMoveQuestion && onMoveQuestion(idx, 'down')}
                  onShuffleItems={() => onShuffleQuestionItems && onShuffleQuestionItems(q.id)}
                  onEdit={(questionToEdit) => {
                    setEditingQuestion(questionToEdit);
                    setIsEditorOpen(true);
                  }}
                  onDelete={onDeleteQuestion}
                  onDuplicate={onDuplicateQuestion}
                  disabled={isGameActive || isQuizActive}
                />
              ))}
            </div>
          )}

          {/* Quiz Questions List */}
          {activeTab === 'quiz' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '16px',
              }}
            >
              {quizQuestions.length === 0 ? (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <p style={{ fontSize: '1rem', marginBottom: '12px' }}>
                    No quiz questions added yet. Click &quot;Add Quiz Question&quot; or &quot;Reset Seeds&quot; to populate.
                  </p>
                </div>
              ) : (
                quizQuestions.map((qq, idx) => (
                  <QuizQuestionCard
                    key={qq.id}
                    quizQuestion={qq}
                    index={idx}
                    onEdit={(quizToEdit) => {
                      setEditingQuizQuestion(quizToEdit);
                      setIsQuizEditorOpen(true);
                    }}
                    onDelete={(id) => onDeleteQuizQuestion && onDeleteQuizQuestion(id)}
                    disabled={isGameActive || isQuizActive}
                  />
                ))
              )}
            </div>
          )}
        </Card>
      </main>

      {/* CATEGORIZATION QUESTION EDITOR MODAL */}
      <QuestionEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        question={editingQuestion}
        onSave={onSaveQuestion}
      />

      {/* QUIZ QUESTION EDITOR MODAL */}
      <QuizQuestionEditor
        isOpen={isQuizEditorOpen}
        onClose={() => setIsQuizEditorOpen(false)}
        quizQuestion={editingQuizQuestion}
        onSave={(savedQ) => {
          if (onSaveQuizQuestion) {
            onSaveQuizQuestion(savedQ);
          }
        }}
      />
    </div>
  );
};

