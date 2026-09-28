import React from 'react';
import { Clock, Edit, Trash2, Copy, Tag, ArrowUp, ArrowDown, Shuffle } from 'lucide-react';
import { Question } from '../types';
import { Button } from './Button';

interface QuestionCardProps {
  question: Question;
  index: number;
  onEdit: (question: Question) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onShuffleItems?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  disabled?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  onEdit,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onShuffleItems,
  canMoveUp = true,
  canMoveDown = true,
  disabled = false,
}) => {
  return (
    <div
      className="card-3d hoverable"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        background: 'var(--bg-surface)',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Reorder Buttons & Index Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <button
              type="button"
              onClick={onMoveUp}
              disabled={disabled || !canMoveUp}
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                cursor: disabled || !canMoveUp ? 'not-allowed' : 'pointer',
                opacity: disabled || !canMoveUp ? 0.3 : 1,
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-main)',
                transition: 'all 0.15s ease',
              }}
              title="Move round earlier (Up)"
            >
              <ArrowUp size={12} />
            </button>
            <span
              style={{
                width: '26px',
                height: '24px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.82rem',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              {index + 1}
            </span>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={disabled || !canMoveDown}
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                cursor: disabled || !canMoveDown ? 'not-allowed' : 'pointer',
                opacity: disabled || !canMoveDown ? 0.3 : 1,
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-main)',
                transition: 'all 0.15s ease',
              }}
              title="Move round later (Down)"
            >
              <ArrowDown size={12} />
            </button>
          </div>

          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {question.title}
          </h4>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            className="badge badge-gray"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Clock size={12} />
            {question.timeLimitSeconds || 30}s
          </span>
          <span className="badge badge-indigo">
            {question.items.length} Items
          </span>
        </div>
      </div>

      {/* Categories preview chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Categories:
        </span>
        {question.categories.map((cat) => (
          <span
            key={cat.id}
            className="badge badge-purple"
            style={{ fontSize: '0.72rem', padding: '2px 8px' }}
          >
            <Tag size={10} />
            {cat.name}
          </span>
        ))}
      </div>

      {/* Items Preview */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Items ({question.items.length}):
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {question.items.slice(0, 6).map((it) =>
              it.imageUrl ? (
                <img
                  key={it.id}
                  src={it.imageUrl}
                  alt={it.name}
                  title={it.name}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '4px',
                    objectFit: 'cover',
                    border: '1px solid var(--border-subtle)',
                    background: '#ffffff',
                  }}
                />
              ) : (
                <span
                  key={it.id}
                  className="badge badge-gray"
                  style={{ fontSize: '0.72rem', padding: '2px 6px' }}
                >
                  {it.name}
                </span>
              )
            )}
            {question.items.length > 6 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                +{question.items.length - 6} more
              </span>
            )}
          </div>
        </div>

        {onShuffleItems && (
          <button
            type="button"
            onClick={onShuffleItems}
            disabled={disabled}
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '3px 8px',
              fontSize: '0.74rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease',
            }}
            title="Randomize this question's item order"
          >
            <Shuffle size={11} />
            Shuffle Items
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '8px',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <Button
          variant="secondary"
          size="sm"
          icon={<Copy size={13} />}
          onClick={() => onDuplicate(question.id)}
          disabled={disabled}
        >
          Duplicate
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={<Edit size={13} />}
          onClick={() => onEdit(question)}
          disabled={disabled}
        >
          Edit
        </Button>
        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 size={13} />}
          onClick={() => onDelete(question.id)}
          disabled={disabled}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

