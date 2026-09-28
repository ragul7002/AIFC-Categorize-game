import React, { useState } from 'react';
import { TransparentVideo } from '../components/TransparentVideo';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { AudioToggle } from '../components/AudioToggle';
import { Sparkles, Users, Layers, PlayCircle, KeyRound, User, ArrowRight, Zap, Trophy, Target, Brain, Flame } from 'lucide-react';
import { sounds } from '../utils/audio';

interface LandingPageProps {
  onCreateGame: (title: string, defaultTimeLimit: number) => void;
  onJoinGame: (roomCode: string, playerName: string) => void;
  isCreating?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onCreateGame,
  onJoinGame,
  isCreating = false,
}) => {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Join form state
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [joinError, setJoinError] = useState('');

  // Create form state
  const [gameTitle, setGameTitle] = useState('Speed Categorization Championship');
  const [roundTime, setRoundTime] = useState(40);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setJoinError('Please enter a Game ID / Room Code');
      return;
    }
    if (!playerName.trim()) {
      setJoinError('Please enter your player name');
      return;
    }
    onJoinGame(roomCode.trim().toUpperCase(), playerName.trim());
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateGame(gameTitle.trim() || 'Speed Categorization Championship', roundTime);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowX: 'hidden',
        backgroundImage: 'url(/landing-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Header Bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 32px',
          maxWidth: '1280px',
          width: '100%',
          margin: '0 auto',
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '0 0 20px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.7)',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div className="aifc-header-logo-badge" title="AI FRONTIER CLUB">
          <img
            src="/aifc-logo.png"
            alt="AI FRONTIER CLUB Logo"
            className="header-logo-img"
            style={{
              width: '46px',
              height: '46px',
              objectFit: 'contain',
            }}
          />
          <div>
            <h1
              style={{
                fontSize: '1.45rem',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                fontFamily: 'Outfit, sans-serif',
                background: 'linear-gradient(135deg, #0f172a 0%, #312e81 40%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              AI FRONTIER CLUB
            </h1>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'var(--primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.09em',
                display: 'block',
              }}
            >
              Categorize Championship
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="aifc-cyber-badge" style={{ display: 'none' }}>
            <Sparkles size={14} color="#06b6d4" />
            <span>AIFC Live</span>
          </div>
          <AudioToggle />
        </div>
      </header>

      {/* Hero Section */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '30px 24px 70px',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '40px',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {/* Left Hero Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Interactive Animated Logo Hero Showcase */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div
                className="aifc-hero-logo-wrapper"
                title="AI FRONTIER CLUB — Hover or click!"
                onClick={() => sounds.playClick()}
              >
                <div className="aifc-hero-logo-halo" />
                <img
                  src="/aifc-logo.png"
                  alt="AI FRONTIER CLUB Insignia"
                  className="aifc-hero-logo-img"
                  style={{
                    width: '105px',
                    height: '105px',
                    objectFit: 'contain',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="aifc-cyber-badge" style={{ alignSelf: 'flex-start' }}>
                  <Sparkles size={14} color="#06b6d4" />
                  Official Club Gaming Arena
                </div>
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  ⚡ High-Speed AI &amp; General Knowledge Sorting
                </span>
              </div>
            </div>

            <h2
              style={{
                fontSize: 'clamp(2.4rem, 4.8vw, 3.6rem)',
                fontWeight: 900,
                lineHeight: 1.08,
                letterSpacing: '-0.03em',
              }}
            >
              AI FRONTIER CLUB <br />
              <span className="aifc-gradient-title">Categorize. Compete. Win.</span>
            </h2>

            <p
              style={{
                fontSize: '1.12rem',
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                maxWidth: '500px',
              }}
            >
              Test your cognitive speed and accuracy in real-time multiplayer rounds.
              Sort target items into matching classifications faster than opponents to claim the championship leaderboard!
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', paddingTop: '6px' }}>
              <Button
                variant="primary"
                size="lg"
                icon={<PlayCircle size={20} />}
                onClick={() => setShowCreateModal(true)}
                disabled={isCreating}
              >
                CREATE GAME
              </Button>

              <Button
                variant="secondary"
                size="lg"
                icon={<Users size={20} />}
                onClick={() => setShowJoinModal(true)}
              >
                JOIN GAME
              </Button>
            </div>

            {/* Quick Interactive Feature Highlights */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
                marginTop: '12px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <div className="interactive-feature-card">
                <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--text-main)', fontWeight: 800 }}>
                  Live Host Sync
                </strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time host scoreboard</span>
              </div>
              <div className="interactive-feature-card">
                <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--text-main)', fontWeight: 800 }}>
                  Speed Scoring
                </strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Faster answers = higher points</span>
              </div>
              <div className="interactive-feature-card">
                <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--text-main)', fontWeight: 800 }}>
                  Fair Play
                </strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Server-side validation</span>
              </div>
            </div>
          </div>

          {/* Right Video - Anchored to the Right with Floating Animated Elements */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              minHeight: '360px',
              width: '100%',
              overflow: 'visible',
            }}
          >
            {/* Ambient Background Glows */}
            <div
              className="aifc-glow-orb"
              style={{
                top: '10%',
                right: '5%',
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(6, 182, 212, 0.22) 0%, rgba(79, 70, 229, 0) 70%)',
              }}
            />
            <div
              className="aifc-glow-orb"
              style={{
                bottom: '10%',
                right: '35%',
                width: '180px',
                height: '180px',
                background: 'radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, rgba(99, 102, 241, 0) 70%)',
                animationDelay: '-3s',
              }}
            />

            {/* Video Container positioned entering from outside the right frame */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                animation: 'aifc-robot-float 7s infinite ease-in-out',
                transformOrigin: 'right center',
              }}
            >
              <TransparentVideo
                src="/aifc-hero-video.mp4"
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '370px',
                }}
              />

              {/* Floating Animated Badges (Compact & Proportional) */}
              <div
                className="aifc-floating-card"
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '-10px',
                  animation: 'aifc-float-slow 5s infinite ease-in-out',
                }}
                onClick={() => sounds.playPop()}
                title="AI Frontier Club Intelligent Classifier"
              >
                <Brain size={14} color="#4f46e5" />
                <span>AI Neural Sorting</span>
              </div>

              <div
                className="aifc-floating-card"
                style={{
                  position: 'absolute',
                  top: '42%',
                  left: '-25px',
                  animation: 'aifc-float-medium 4.2s infinite ease-in-out',
                  animationDelay: '-1.5s',
                }}
                onClick={() => sounds.playPop()}
                title="Lightning speed rounds"
              >
                <Zap size={14} color="#f59e0b" />
                <span>30s Speed Blitz</span>
              </div>

              <div
                className="aifc-floating-card"
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  animation: 'aifc-float-fast 4.6s infinite ease-in-out',
                  animationDelay: '-2.8s',
                }}
                onClick={() => sounds.playPop()}
                title="Earn maximum streak combo"
              >
                <Trophy size={14} color="#059669" />
                <span>+500 PTS Streak</span>
              </div>

              <div
                className="aifc-floating-card"
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '-8px',
                  animation: 'aifc-float-reverse 4.8s infinite ease-in-out',
                  animationDelay: '-0.8s',
                }}
                onClick={() => sounds.playPop()}
                title="Target accuracy bonus"
              >
                <Target size={14} color="#06b6d4" />
                <span>100% Match Rate</span>
              </div>

              <div
                className="aifc-floating-card"
                style={{
                  position: 'absolute',
                  bottom: '22px',
                  right: '-12px',
                  animation: 'aifc-float-slow 5.4s infinite ease-in-out',
                  animationDelay: '-2.1s',
                }}
                onClick={() => sounds.playPop()}
                title="Real-time multi battle arena"
              >
                <Flame size={14} color="#ef4444" />
                <span>Live Arena</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* JOIN GAME MODAL */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join a Game Room"
        subtitle="Enter the Room Code provided by the host and choose your player nickname."
      >
        <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {joinError && (
            <div
              style={{
                padding: '10px 14px',
                background: 'var(--error-light)',
                border: '1px solid var(--error-border)',
                color: 'var(--error)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                fontWeight: 600,
              }}
            >
              {joinError}
            </div>
          )}

          <Input
            label="Game ID / Room Code"
            placeholder="e.g. A7X92K"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            leftIcon={<KeyRound size={16} />}
            autoFocus
          />

          <Input
            label="Your Player Name"
            placeholder="e.g. Alex"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            leftIcon={<User size={16} />}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button variant="ghost" type="button" onClick={() => setShowJoinModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" icon={<ArrowRight size={16} />}>
              Enter Room
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATE GAME MODAL */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Game Room"
        subtitle="Choose your game title and default question time limit."
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Game Name"
            placeholder="e.g. Speed Categorization Championship"
            value={gameTitle}
            onChange={(e) => setGameTitle(e.target.value)}
          />

          <Input
            label="Default Round Time Limit (Seconds)"
            type="number"
            min="10"
            max="180"
            value={roundTime}
            onChange={(e) => setRoundTime(Number(e.target.value))}
            helperText="Default time allocated per question. Can be adjusted per question in the dashboard."
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button variant="ghost" type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isCreating}>
              {isCreating ? 'Creating Room...' : 'Launch Host Dashboard'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* FOOTER */}
      <footer className="aifc-footer">
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src="/aifc-logo.png"
              alt="AI FRONTIER CLUB"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                objectFit: 'contain',
              }}
            />
            <span
              style={{
                fontWeight: 800,
                fontSize: '0.9rem',
                letterSpacing: '0.05em',
                color: 'var(--text-main)',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              AI FRONTIER CLUB
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            designed &amp; developed by{' '}
            <span className="aifc-footer-highlight" style={{ fontSize: '0.88rem' }}>
              Ragul
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
};
