import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Plus, Trash2, CheckCircle2, Upload, Image as ImageIcon, X } from 'lucide-react';
import { QuizQuestion } from '../types';

interface QuizQuestionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  quizQuestion?: QuizQuestion | null;
  question?: QuizQuestion | null;
  onSave: (quizQuestion: Partial<QuizQuestion>) => void;
}

export const QuizQuestionEditor: React.FC<QuizQuestionEditorProps> = ({
  isOpen,
  onClose,
  quizQuestion: qqProp,
  question: qProp,
  onSave,
}) => {
  const quizQuestion = qqProp !== undefined ? qqProp : qProp;
  const [text, setText] = useState('Which category does this belong to?');
  const [imageUrl, setImageUrl] = useState('');
  const [options, setOptions] = useState<string[]>(['Laptop', 'Phone', 'Car', 'Bike', 'Sports']);
  const [correctOption, setCorrectOption] = useState('Laptop');
  const [timeLimit, setTimeLimit] = useState(20);
  const [error, setError] = useState('');

  useEffect(() => {
    if (quizQuestion) {
      setText(quizQuestion.text || 'Which category does this belong to?');
      setImageUrl(quizQuestion.imageUrl || '');
      setOptions(quizQuestion.options ? [...quizQuestion.options] : ['Option 1', 'Option 2', 'Option 3', 'Option 4']);
      setCorrectOption(quizQuestion.correctOption || quizQuestion.options?.[0] || '');
      setTimeLimit(quizQuestion.timeLimitSeconds || 20);
    } else {
      setText('Which category does this belong to?');
      setImageUrl('');
      setOptions(['Laptop', 'Phone', 'Car', 'Bike', 'Sports']);
      setCorrectOption('Laptop');
      setTimeLimit(20);
    }
    setError('');
  }, [quizQuestion, isOpen]);

  const handleAddOption = () => {
    if (options.length >= 6) {
      setError('A quiz question can have at most 6 options');
      return;
    }
    const newOpt = `Option ${options.length + 1}`;
    setOptions([...options, newOpt]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      setError('A quiz question must have at least 2 options');
      return;
    }
    const target = options[index];
    const filtered = options.filter((_, idx) => idx !== index);
    setOptions(filtered);
    if (correctOption === target) {
      setCorrectOption(filtered[0] || '');
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const oldVal = options[index];
    const updated = options.map((opt, idx) => (idx === index ? val : opt));
    setOptions(updated);
    if (correctOption === oldVal) {
      setCorrectOption(val);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setImageUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!imageUrl.trim()) {
      setError('Please provide an image (upload or URL)');
      return;
    }
    if (options.some((o) => !o.trim())) {
      setError('All options must have a text name');
      return;
    }
    if (!correctOption.trim()) {
      setError('Please select which option is the correct answer');
      return;
    }

    onSave({
      id: quizQuestion?.id,
      text: text.trim() || 'Which category does this belong to?',
      imageUrl: imageUrl.trim(),
      options: options.map((o) => o.trim()),
      correctOption: correctOption.trim(),
      timeLimitSeconds: Number(timeLimit) || 20,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={quizQuestion ? 'Edit Quiz Question' : 'Add Quiz Question'}
      subtitle="Provide a question image, define 4 or 5 category options, and mark the correct answer."
      maxWidth="600px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {error && (
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
            {error}
          </div>
        )}

        {/* Question Prompt Text */}
        <Input
          label="Question Prompt / Text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Which category does this belong to?"
        />

        {/* Time Limit */}
        <Input
          label="Time Limit (Seconds)"
          type="number"
          min="5"
          max="120"
          value={timeLimit}
          onChange={(e) => setTimeLimit(Number(e.target.value))}
          helperText="Seconds allocated for players to choose an answer."
        />

        {/* Image Upload & Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Question Image (Upload or URL)
          </label>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {imageUrl ? (
              <div
                style={{
                  position: 'relative',
                  width: '90px',
                  height: '90px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '2px solid var(--primary)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  flexShrink: 0,
                }}
              >
                <img
                  src={imageUrl}
                  alt="Quiz Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  title="Remove Image"
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '12px',
                  background: '#f1f5f9',
                  border: '2px dashed #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  flexShrink: 0,
                }}
              >
                <ImageIcon size={28} />
              </div>
            )}

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Input
                placeholder="Paste Image URL (https://...)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />

              <div>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: 'rgba(79, 70, 229, 0.08)',
                    color: 'var(--primary)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid rgba(79, 70, 229, 0.2)',
                  }}
                >
                  <Upload size={14} />
                  <span>Upload Image File</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Category Options (4 or 5 options) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Category Options ({options.length})
              </label>
              <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Click the radio/check icon on an option to set it as the correct answer.
              </span>
            </div>

            {options.length < 6 && (
              <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={handleAddOption}>
                Add Option
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {options.map((opt, idx) => {
              const isCorrect = correctOption === opt;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    background: isCorrect ? 'rgba(16, 185, 129, 0.08)' : '#f8fafc',
                    border: isCorrect ? '2px solid #10b981' : '1px solid #e2e8f0',
                  }}
                >
                  {/* Select Correct Answer Button */}
                  <button
                    type="button"
                    onClick={() => setCorrectOption(opt)}
                    title={isCorrect ? 'Correct Answer' : 'Click to set as Correct Answer'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: isCorrect ? '#10b981' : '#ffffff',
                      color: isCorrect ? '#ffffff' : '#94a3b8',
                      border: isCorrect ? 'none' : '2px solid #cbd5e1',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircle2 size={16} />
                  </button>

                  {/* Option Text Input */}
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                  />

                  {/* Correct Badge */}
                  {isCorrect && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: '#10b981',
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                      }}
                    >
                      Correct Answer
                    </span>
                  )}

                  {/* Delete Option */}
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      title="Delete Option"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {quizQuestion ? 'Save Changes' : 'Add Quiz Question'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
