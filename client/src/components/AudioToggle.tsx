import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sounds } from '../utils/audio';

export const AudioToggle: React.FC = () => {
  const [muted, setMuted] = useState(sounds.isMuted());

  const handleToggle = () => {
    const next = sounds.toggleMute();
    setMuted(next);
  };

  return (
    <button
      onClick={handleToggle}
      className="btn-3d btn-secondary"
      style={{
        padding: '8px 12px',
        fontSize: '0.85rem',
        borderRadius: 'var(--radius-md)',
      }}
      title={muted ? 'Unmute Sound FX' : 'Mute Sound FX'}
      aria-label={muted ? 'Unmute Sound FX' : 'Mute Sound FX'}
    >
      {muted ? <VolumeX size={16} color="var(--error)" /> : <Volume2 size={16} color="var(--primary)" />}
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        {muted ? 'Sound: Off' : 'Sound: On'}
      </span>
    </button>
  );
};
