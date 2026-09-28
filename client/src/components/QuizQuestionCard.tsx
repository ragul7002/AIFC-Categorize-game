import React from 'react';
import { Clock, Edit, Trash2, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { QuizQuestion } from '../types';
import { Button } from './Button';

interface QuizQuestionCardProps {
  quizQuestion?: QuizQuestion;
  question?: QuizQuestion;
  index: number;
  onEdit: (quizQuestion: QuizQuestion) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}

export const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({
  quizQuestion: qqProp,
  question: qProp,
  index,
  onEdit,
  onDelete,
  disabled = false,
}) => {
  const quizQuestion = (qqProp || qProp)!;

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
        borderRadius: '16px',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(79, 70, 229, 0.1)',
              color: 'var(--primary)',
              fontWeight: 800,
              fontSize: '0.85rem',
            }}
          >
            #{index + 1}
          </div>

          <div>
            <h4
              style={{
                margin: 0,
                fontSize: '1.05rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                lineHeight: 1.2,
              }}
            >
              {quizQuestion.text || `Quiz Question ${index + 1}`}
            </h4>
          </div>
        </div>

        {/* Time Limit Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            fontWeight: 700,
            background: 'var(--bg-subtle)',
            padding: '4px 10px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <Clock size={14} />
          <span>{quizQuestion.timeLimitSeconds || 20}s</span>
        </div>
      </div>

      {/* Main Content: Image & Options */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Image Thumbnail */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {quizQuestion.imageUrl ? (
            <img
              src={quizQuestion.imageUrl}
              alt="Quiz Image"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <ImageIcon size={28} color="#94a3b8" />
          )}
        </div>

        {/* Options Badges List */}
        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {quizQuestion.options.map((opt, idx) => {
            const isCorrect = opt === quizQuestion.correctOption;
            return (
              <div
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  background: isCorrect ? 'rgba(16, 185, 129, 0.12)' : 'rgba(241, 245, 249, 0.8)',
                  border: isCorrect ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                  color: isCorrect ? '#047857' : 'var(--text-main)',
                  fontWeight: isCorrect ? 800 : 600,
                  fontSize: '0.85rem',
                }}
              >
                {isCorrect && <CheckCircle2 size={14} color="#10b981" />}
                <span>{opt}</span>
                {isCorrect && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      background: '#10b981',
                      color: '#ffffff',
                      padding: '1px 5px',
                      borderRadius: '4px',
                    }}
                  >
                    Answer
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '8px',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '12px',
        }}
      >
        <Button
          variant="secondary"
          size="sm"
          icon={<Edit size={14} />}
          onClick={() => onEdit(quizQuestion)}
          disabled={disabled}
        >
          Edit
        </Button>
        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 size={14} />}
          onClick={() => onDelete(quizQuestion.id)}
          disabled={disabled}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};
