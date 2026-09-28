import React from 'react';
import { HostLivePlayerRow } from '../types';
import { Award, Clock, CheckCircle2, XCircle, Wifi, WifiOff, UserX } from 'lucide-react';

interface LiveScoreboardProps {
  players: HostLivePlayerRow[];
  currentRoundIndex: number;
  onKickPlayer?: (playerId: string) => void;
}

export const LiveScoreboard: React.FC<LiveScoreboardProps> = ({ players, currentRoundIndex, onKickPlayer }) => {
  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Live Player Standings
          </h3>
          <span className="badge badge-indigo">Host Eyes Only</span>
        </div>
        <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          {players.length} {players.length === 1 ? 'Player' : 'Players'}
        </span>
      </div>

      {players.length === 0 ? (
        <div
          style={{
            padding: '36px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1.5px dashed var(--border-subtle)',
          }}
        >
          No players joined yet. Share the Room Code with players!
        </div>
      ) : (
        <table className="scoreboard-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Rank</th>
              <th>Player Name</th>
              <th>Status</th>
              <th>Correct</th>
              <th>Wrong</th>
              <th>Round Time</th>
              <th>Round Pts</th>
              <th style={{ textAlign: 'right' }}>Total Score</th>
              {onKickPlayer && <th style={{ textAlign: 'center', width: '90px' }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const isRank1 = p.rank === 1;
              const isRank2 = p.rank === 2;
              const isRank3 = p.rank === 3;

              let rankBadgeColor = 'var(--text-muted)';
              let rankBg = 'var(--bg-subtle)';
              if (isRank1) {
                rankBadgeColor = '#b45309';
                rankBg = '#fef3c7';
              } else if (isRank2) {
                rankBadgeColor = '#475569';
                rankBg = '#e2e8f0';
              } else if (isRank3) {
                rankBadgeColor = '#92400e';
                rankBg = '#fed7aa';
              }

              return (
                <tr key={p.playerId} className="row-card">
                  {/* Rank */}
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-full)',
                        background: rankBg,
                        color: rankBadgeColor,
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        fontFamily: 'Outfit, sans-serif',
                      }}
                    >
                      {p.rank}
                    </span>
                  </td>

                  {/* Player Name */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.playerName}</span>
                      {p.isConnected ? (
                        <span title="Connected">
                          <Wifi size={13} color="var(--success)" />
                        </span>
                      ) : (
                        <span title="Disconnected">
                          <WifiOff size={13} color="var(--text-subtle)" />
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    {p.status === 'submitted' ? (
                      <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
                        Submitted
                      </span>
                    ) : (
                      <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>
                        Thinking...
                      </span>
                    )}
                  </td>

                  {/* Correct */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)' }}>
                      <CheckCircle2 size={14} />
                      <span style={{ fontWeight: 700 }}>{p.correctCount}</span>
                    </div>
                  </td>

                  {/* Wrong */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--error)' }}>
                      <XCircle size={14} />
                      <span style={{ fontWeight: 700 }}>{p.wrongCount}</span>
                    </div>
                  </td>

                  {/* Round Time */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                      <Clock size={13} />
                      <span>{p.completionTimeMs ? `${(p.completionTimeMs / 1000).toFixed(1)}s` : '—'}</span>
                    </div>
                  </td>

                  {/* Round Score */}
                  <td>
                    <span style={{ fontWeight: 600, color: p.roundScore > 0 ? 'var(--primary)' : 'var(--text-subtle)' }}>
                      +{p.roundScore}
                    </span>
                  </td>

                  {/* Total Score */}
                  <td style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        color: 'var(--primary)',
                      }}
                    >
                      {p.totalScore.toLocaleString()}
                    </span>
                  </td>

                  {/* Kick Action */}
                  {onKickPlayer && (
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to kick ${p.playerName} from the game?`)) {
                            onKickPlayer(p.playerId);
                          }
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          background: 'var(--error-light)',
                          color: 'var(--error)',
                          border: '1px solid var(--error-border)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        title={`Kick ${p.playerName} out of the game`}
                      >
                        <UserX size={13} />
                        Kick
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};
