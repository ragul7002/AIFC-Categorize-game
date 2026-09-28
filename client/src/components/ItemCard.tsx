import React, { useState } from 'react';
import { CheckCircle2, GripHorizontal } from 'lucide-react';
import { ItemPublic } from '../types';
import { sounds } from '../utils/audio';

interface ItemCardProps {
  item: ItemPublic;
  isAssigned?: boolean;
  assignedCategoryName?: string;
  isSelected?: boolean;
  onSelect?: (item: ItemPublic) => void;
  onDragStart?: (e: React.DragEvent, item: ItemPublic) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onClickRemove?: (item: ItemPublic) => void;
  disabled?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  isAssigned = false,
  assignedCategoryName,
  isSelected = false,
  onSelect,
  onDragStart,
  onDragEnd,
  onClickRemove,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    if (disabled) return;
    setIsDragging(true);
    sounds.playLift();
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) onDragStart(e, item);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    if (onDragEnd) onDragEnd(e);
  };

  const handleClick = () => {
    if (disabled) return;
    sounds.playClick();
    if (onSelect) onSelect(item);
  };

  return (
    <div
      draggable={!disabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={`item-image-card-3d ${isDragging ? 'dragging' : ''} ${isSelected ? 'selected-mobile' : ''}`}
      style={{
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'grab',
        background: isAssigned ? 'var(--bg-subtle)' : 'var(--bg-surface)',
        borderColor: isSelected ? 'var(--primary)' : undefined,
      }}
      title={
        isAssigned
          ? `Placed in ${assignedCategoryName}. Click to re-assign or tap another category.`
          : 'Drag to a category or click/tap to assign'
      }
    >
      {/* Draggable indicator icon on top right */}
      <div
        style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          zIndex: 2,
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(4px)',
          borderRadius: '4px',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <GripHorizontal size={12} color="var(--text-subtle)" />
      </div>

      {/* Image Content */}
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderRadius: 'var(--radius-sm)',
          background: '#ffffff',
        }}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name || 'Question Item'}
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 'var(--radius-sm)',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '6px',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: 'var(--text-main)',
              lineHeight: 1.2,
            }}
          >
            {item.name}
          </div>
        )}
      </div>

      {isAssigned && (
        <div
          style={{
            position: 'absolute',
            bottom: '4px',
            right: '4px',
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <CheckCircle2 size={16} color="var(--success)" />
        </div>
      )}
    </div>
  );
};
