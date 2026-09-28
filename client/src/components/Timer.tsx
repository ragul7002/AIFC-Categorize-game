import React, { useEffect } from 'react';
import { Clock } from 'lucide-react';
import { sounds } from '../utils/audio';

interface TimerProps {
  seconds: number;
  totalSeconds: number;
  isPaused?: boolean;
}

export const Timer: React.FC<TimerProps> = ({ seconds, totalSeconds, isPaused = false }) => {
  const safeTotal = Math.max(1, totalSeconds);
  const displaySeconds = Math.max(0, Math.round(seconds || 0));
  const percent = Math.min(100, Math.max(0, (displaySeconds / safeTotal) * 100));

  const isUrgent = displaySeconds <= 7 && displaySeconds > 0;
  const isWarning = displaySeconds <= 15 && displaySeconds > 7;

  useEffect(() => {
    if (isUrgent && !isPaused) {
      sounds.playTick();
    }
  }, [displaySeconds, isUrgent, isPaused]);

  let statusColor = 'var(--primary)';
  let bgBadge = 'var(--primary-light)';
  let borderBadge = 'var(--primary-border)';

  if (isUrgent || displaySeconds === 0) {
    statusColor = 'var(--error)';
    bgBadge = 'var(--error-light)';
    borderBadge = 'var(--error-border)';
  } else if (isWarning) {
    statusColor = 'var(--warning)';
    bgBadge = 'var(--warning-light)';
    borderBadge = 'var(--warning-border)';
  }

  return (
    <div
      className={`card-3d ${isUrgent ? 'animate-pulse-warning' : ''}`}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px 18px',
        minWidth: '130px',
        background: 'var(--bg-surface)',
        borderColor: borderBadge,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Clock size={18} color={statusColor} />
        <span
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '1.4rem',
            fontWeight: 800,
            color: statusColor,
            lineHeight: 1,
          }}
        >
          {displaySeconds}s
        </span>
        {isPaused && (
          <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
            PAUSED
          </span>
        )}
      </div>

      {/* Progress Bar with 3D inset */}
      <div
        style={{
          width: '100%',
          height: '6px',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          marginTop: '8px',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            background: statusColor,
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.3s ease, background 0.3s ease',
          }}
        />
      </div>
    </div>
  );
};
