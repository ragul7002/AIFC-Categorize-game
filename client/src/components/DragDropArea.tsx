import React, { useState } from 'react';
import { ItemPublic, Category } from '../types';
import { ItemCard } from './ItemCard';
import { CategoryCard } from './CategoryCard';
import { Button } from './Button';
import { RotateCcw, HelpCircle } from 'lucide-react';
import { sounds } from '../utils/audio';

interface DragDropAreaProps {
  categories: Category[];
  items: ItemPublic[];
  itemPlacements: Record<string, string>; // itemId -> categoryId
  onPlacementChange: (newPlacements: Record<string, string>) => void;
  disabled?: boolean;
}

export const DragDropArea: React.FC<DragDropAreaProps> = ({
  categories,
  items,
  itemPlacements,
  onPlacementChange,
  disabled = false,
}) => {
  const [selectedItemForTap, setSelectedItemForTap] = useState<ItemPublic | null>(null);

  // Group placed items by category
  const placedItemsByCategory: Record<string, ItemPublic[]> = {};
  for (const cat of categories) {
    placedItemsByCategory[cat.id] = [];
  }

  // Find remaining uncategorized items
  const uncategorizedItems: ItemPublic[] = [];
  for (const item of items) {
    const catId = itemPlacements[item.id];
    if (catId && placedItemsByCategory[catId]) {
      placedItemsByCategory[catId].push(item);
    } else {
      uncategorizedItems.push(item);
    }
  }

  const handleDropItem = (categoryId: string, itemId: string) => {
    onPlacementChange({
      ...itemPlacements,
      [itemId]: categoryId,
    });
    setSelectedItemForTap(null);
  };

  const handleRemoveItem = (itemId: string) => {
    const updated = { ...itemPlacements };
    delete updated[itemId];
    onPlacementChange(updated);
  };

  const handleSelectTapItem = (item: ItemPublic) => {
    if (selectedItemForTap?.id === item.id) {
      setSelectedItemForTap(null); // Deselect
    } else {
      setSelectedItemForTap(item);
    }
  };

  const handleTapAssign = (categoryId: string) => {
    if (selectedItemForTap) {
      handleDropItem(categoryId, selectedItemForTap.id);
    }
  };

  const handleReset = () => {
    sounds.playClick();
    onPlacementChange({});
    setSelectedItemForTap(null);
  };

  const categorizedCount = Object.keys(itemPlacements).length;
  const totalCount = items.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* Uncategorized Items Tray */}
      <div
        className="card-3d"
        style={{
          padding: '20px',
          background: 'var(--bg-surface)',
          borderBottom: '3px solid #cbd5e1',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              ITEMS TO CATEGORIZE
            </h4>
            <span
              className={`badge ${categorizedCount === totalCount ? 'badge-green' : 'badge-indigo'}`}
            >
              {categorizedCount} / {totalCount} Placed
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <HelpCircle size={14} />
              Drag or tap items
            </span>
            {categorizedCount > 0 && !disabled && (
              <Button
                variant="ghost"
                size="sm"
                icon={<RotateCcw size={14} />}
                onClick={handleReset}
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Item Chips Pool */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            minHeight: '52px',
            alignItems: 'center',
          }}
        >
          {uncategorizedItems.length === 0 ? (
            <div
              style={{
                fontSize: '0.92rem',
                color: 'var(--success)',
                fontWeight: 600,
                padding: '8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              ✨ All items categorized! Click &quot;Submit Answers&quot; when ready.
            </div>
          ) : (
            uncategorizedItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                isSelected={selectedItemForTap?.id === item.id}
                onSelect={handleSelectTapItem}
                disabled={disabled}
              />
            ))
          )}
        </div>
      </div>

      {/* Categories Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
        }}
      >
        {categories.map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            items={placedItemsByCategory[cat.id] || []}
            onDropItem={handleDropItem}
            onRemoveItem={handleRemoveItem}
            selectedItemForTap={selectedItemForTap}
            onTapAssign={handleTapAssign}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
};
