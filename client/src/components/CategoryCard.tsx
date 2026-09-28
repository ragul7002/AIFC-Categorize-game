import React, { useState } from 'react';
import { X, ArrowDownCircle } from 'lucide-react';
import { Category, ItemPublic } from '../types';
import { sounds } from '../utils/audio';

interface CategoryCardProps {
  category: Category;
  items: ItemPublic[];
  onDropItem: (categoryId: string, itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
  selectedItemForTap: ItemPublic | null;
  onTapAssign?: (categoryId: string) => void;
  disabled?: boolean;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  items,
  onDropItem,
  onRemoveItem,
  selectedItemForTap,
  onTapAssign,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragOver(false);
    const itemId = e.dataTransfer.getData('text/plain');
    if (itemId) {
      sounds.playDrop();
      onDropItem(category.id, itemId);
    }
  };

  const handleClickBox = () => {
    if (disabled) return;
    if (selectedItemForTap && onTapAssign) {
      sounds.playDrop();
      onTapAssign(category.id);
    }
  };

  const accentClass = `cat-accent-${(category.colorIndex ?? 0) % 6}`;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClickBox}
      className={`category-box-3d ${accentClass} ${isDragOver ? 'drag-over' : ''}`}
      style={{
        cursor: selectedItemForTap ? 'pointer' : 'default',
        boxShadow: selectedItemForTap ? '0 0 0 2px var(--primary-border), var(--shadow-card)' : undefined,
      }}
    >
      {/* Category Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <h4
          style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-main)',
          }}
        >
          {category.name}
        </h4>
        <span
          className="badge badge-indigo"
          style={{
            fontSize: '0.75rem',
            padding: '2px 8px',
          }}
        >
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Target prompt if item selected in tap mode */}
      {selectedItemForTap && (
        <div
          style={{
            padding: '6px 10px',
            marginBottom: '10px',
            background: 'var(--primary-light)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            color: 'var(--primary)',
            fontWeight: 600,
          }}
        >
          {selectedItemForTap.imageUrl && (
            <img
              src={selectedItemForTap.imageUrl}
              alt={selectedItemForTap.name}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />
          )}
          <ArrowDownCircle size={14} style={{ flexShrink: 0 }} />
          <span>Tap to place image in &ldquo;{category.name}&rdquo;</span>
        </div>
      )}

      {/* Placed Items List */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          flexGrow: 1,
          alignContent: 'flex-start',
          minHeight: '80px',
        }}
      >
        {items.length === 0 && !isDragOver && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-subtle)',
              fontSize: '0.85rem',
              fontStyle: 'italic',
              height: '100%',
              border: '1.5px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
            }}
          >
            Drop images here
          </div>
        )}

        {isDragOver && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              fontSize: '0.9rem',
              fontWeight: 600,
              height: '80px',
              border: '2px dashed var(--primary)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(79, 70, 229, 0.05)',
            }}
          >
            Release to assign image
          </div>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            draggable={!disabled}
            onDragStart={(e) => {
              if (disabled) return;
              e.dataTransfer.setData('text/plain', item.id);
              e.dataTransfer.effectAllowed = 'move';
              sounds.playLift();
            }}
            style={{
              position: 'relative',
              width: '68px',
              height: '68px',
              padding: '3px',
              background: 'var(--bg-surface)',
              border: '1.5px solid var(--border-subtle)',
              borderBottom: '2.5px solid #cbd5e1',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              cursor: disabled ? 'default' : 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
            title={item.name || 'Placed image'}
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name || 'Categorized item'}
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-sm)',
                  pointerEvents: 'none',
                }}
              />
            ) : (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  lineHeight: 1.1,
                  padding: '2px',
                  color: 'var(--text-main)',
                }}
              >
                {item.name}
              </span>
            )}

            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sounds.playClick();
                  onRemoveItem(item.id);
                }}
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  background: 'rgba(239, 68, 68, 0.9)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '18px',
                  height: '18px',
                  color: '#ffffff',
                  borderRadius: '50%',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'transform 0.15s ease',
                  padding: 0,
                }}
                title={`Remove from ${category.name}`}
                aria-label={`Remove item`}
              >
                <X size={11} strokeWidth={3} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
