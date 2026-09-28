import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '540px',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.35)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="card-3d"
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1.5px solid rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(31, 38, 135, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.9)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            borderRadius: 'var(--radius-sm)',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            transition: 'all 0.15s ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          }}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: '20px', paddingRight: '32px' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Body */}
        <div>{children}</div>
      </div>
    </div>
  );
};
