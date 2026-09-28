import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Plus, Trash2, Tag, CheckCircle2, Upload, Image as ImageIcon, RefreshCw, X, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';
import { Question, Category, Item } from '../types';

interface QuestionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
  onSave: (question: Partial<Question>) => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  isOpen,
  onClose,
  question,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(35);
  const [categories, setCategories] = useState<Category[]>([
    { id: 'cat-1', name: 'Food', colorIndex: 0 },
    { id: 'cat-2', name: 'Animals', colorIndex: 1 },
  ]);
  const [items, setItems] = useState<Item[]>([
    { id: 'item-1', name: 'Apple', correctCategoryId: 'cat-1' },
    { id: 'item-2', name: 'Tiger', correctCategoryId: 'cat-2' },
  ]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (question) {
      setTitle(question.title);
      setTimeLimit(question.timeLimitSeconds || 35);
      setCategories(JSON.parse(JSON.stringify(question.categories)));
      setItems(JSON.parse(JSON.stringify(question.items)));
    } else {
      setTitle('');
      setTimeLimit(35);
      setCategories([
        { id: `cat-1-${Date.now()}`, name: 'Category A', colorIndex: 0 },
        { id: `cat-2-${Date.now()}`, name: 'Category B', colorIndex: 1 },
      ]);
      setItems([
        { id: `item-1-${Date.now()}`, name: 'Sample Item 1', correctCategoryId: `cat-1-${Date.now()}` },
      ]);
    }
    setError('');
  }, [question, isOpen]);

  // CATEGORIES
  const handleAddCategory = () => {
    const newId = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setCategories([
      ...categories,
      { id: newId, name: `Category ${String.fromCharCode(65 + categories.length)}`, colorIndex: categories.length % 6 },
    ]);
  };

  const handleRemoveCategory = (id: string) => {
    if (categories.length <= 2) {
      setError('A question must have at least 2 categories');
      return;
    }
    const filtered = categories.filter((c) => c.id !== id);
    setCategories(filtered);
    // Re-assign items pointing to removed category to first category
    setItems(
      items.map((it) => (it.correctCategoryId === id ? { ...it, correctCategoryId: filtered[0].id } : it))
    );
  };

  const handleCategoryNameChange = (id: string, name: string) => {
    setCategories(categories.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  const handleMoveCategory = (index: number, direction: 'prev' | 'next') => {
    const targetIndex = direction === 'prev' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const newCats = [...categories];
    const [moved] = newCats.splice(index, 1);
    newCats.splice(targetIndex, 0, moved);
    setCategories(newCats);
  };

  const handleShuffleCategories = () => {
    setCategories([...categories].sort(() => Math.random() - 0.5));
  };

  // ITEMS
  const handleAddItem = () => {
    const newId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setItems([
      ...items,
      { id: newId, name: '', imageUrl: '', correctCategoryId: categories[0]?.id || '' },
    ]);
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const newItems = [...items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);
    setItems(newItems);
  };

  const handleShuffleItems = () => {
    setItems([...items].sort(() => Math.random() - 0.5));
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      setError('A question must have at least 1 item');
      return;
    }
    setItems(items.filter((it) => it.id !== id));
  };

  const handleItemNameChange = (id: string, name: string) => {
    setItems(items.map((it) => (it.id === id ? { ...it, name } : it)));
  };

  const handleItemImageUrlChange = (id: string, imageUrl: string) => {
    setItems(items.map((it) => (it.id === id ? { ...it, imageUrl } : it)));
  };

  const handleItemFileUpload = (id: string, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setItems((prev) =>
          prev.map((it) => {
            if (it.id === id) {
              const cleanFileName = file.name.replace(/\.[^/.]+$/, '').trim();
              return {
                ...it,
                imageUrl: result,
                name: it.name.trim() ? it.name : cleanFileName,
              };
            }
            return it;
          })
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleItemCategoryChange = (id: string, catId: string) => {
    setItems(items.map((it) => (it.id === id ? { ...it, correctCategoryId: catId } : it)));
  };

  const handleSave = () => {
    if (!title.trim()) {
      setError('Please enter a question title');
      return;
    }
    if (categories.some((c) => !c.name.trim())) {
      setError('All categories must have a name');
      return;
    }
    if (items.some((it) => !it.imageUrl && !it.name.trim())) {
      setError('All items must have an uploaded image or a name');
      return;
    }
    if (items.some((it) => !it.correctCategoryId)) {
      setError('All items must have a correct category selected');
      return;
    }

    onSave({
      id: question?.id,
      title: title.trim(),
      timeLimitSeconds: Number(timeLimit) || 35,
      categories,
      items: items.map((it, idx) => ({
        ...it,
        name: it.name.trim() || `Item ${idx + 1}`,
      })),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={question ? 'Edit Question' : 'Create New Question'}
      subtitle="Define the title, categories, and items with their correct mapping."
      maxWidth="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--error-light)',
              border: '1px solid var(--error-border)',
              color: 'var(--error)',
              fontSize: '0.88rem',
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {/* Title & Time Limit */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '14px' }}>
          <Input
            label="Question Title"
            placeholder="e.g. Living & Non-Living Classification"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Time Limit (s)"
            type="number"
            min="10"
            max="180"
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
          />
        </div>

        {/* Categories Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                fontFamily: 'Outfit, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Tag size={16} color="var(--primary)" />
              Categories ({categories.length})
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                variant="secondary"
                size="sm"
                icon={<Shuffle size={13} />}
                onClick={handleShuffleCategories}
                title="Randomize category display order"
              >
                Shuffle
              </Button>
              <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={handleAddCategory}>
                Add Category
              </Button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '10px',
            }}
          >
            {categories.map((cat, i) => (
              <div
                key={cat.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-subtle)',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <button
                    type="button"
                    onClick={() => handleMoveCategory(i, 'prev')}
                    disabled={i === 0}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: i === 0 ? 'not-allowed' : 'pointer',
                      opacity: i === 0 ? 0.3 : 1,
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px',
                    }}
                    title="Move category left"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveCategory(i, 'next')}
                    disabled={i === categories.length - 1}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: i === categories.length - 1 ? 'not-allowed' : 'pointer',
                      opacity: i === categories.length - 1 ? 0.3 : 1,
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px',
                    }}
                    title="Move category right"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>

                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) => handleCategoryNameChange(cat.id, e.target.value)}
                  placeholder={`Category ${i + 1}`}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontFamily: 'inherit',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    width: '100%',
                    outline: 'none',
                    color: 'var(--text-main)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(cat.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                  }}
                  title="Remove category"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Items Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                fontFamily: 'Outfit, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={16} color="var(--success)" />
              Items & Correct Category ({items.length})
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                variant="secondary"
                size="sm"
                icon={<Shuffle size={13} />}
                onClick={handleShuffleItems}
                title="Randomize item presentation order"
              >
                Shuffle Items
              </Button>
              <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={handleAddItem}>
                Add Item
              </Button>
            </div>
          </div>

          <div
            style={{
              maxHeight: '260px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingRight: '4px',
            }}
          >
            {items.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '44px minmax(180px, 1.2fr) minmax(130px, 1fr) 150px 32px',
                  gap: '8px',
                  alignItems: 'center',
                  background: 'var(--bg-surface)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {/* Move Up/Down Item Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <button
                    type="button"
                    onClick={() => handleMoveItem(idx, 'up')}
                    disabled={idx === 0}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: idx === 0 ? 'not-allowed' : 'pointer',
                      opacity: idx === 0 ? 0.3 : 1,
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '1px',
                    }}
                    title="Move item up"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleMoveItem(idx, 'down')}
                    disabled={idx === items.length - 1}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: idx === items.length - 1 ? 'not-allowed' : 'pointer',
                      opacity: idx === items.length - 1 ? 0.3 : 1,
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '1px',
                    }}
                    title="Move item down"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>

                {/* Image Upload / Preview Block */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <input
                    type="file"
                    id={`file-input-${item.id}`}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleItemFileUpload(item.id, file);
                      e.target.value = '';
                    }}
                  />

                  {item.imageUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <div
                        onClick={() => document.getElementById(`file-input-${item.id}`)?.click()}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden',
                          border: '1.5px solid var(--primary-border)',
                          cursor: 'pointer',
                          background: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                          flexShrink: 0,
                        }}
                        title="Click to replace image"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name || 'Item preview'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button
                          type="button"
                          onClick={() => document.getElementById(`file-input-${item.id}`)?.click()}
                          style={{
                            background: 'var(--primary-light)',
                            border: '1px solid var(--primary-border)',
                            borderRadius: '4px',
                            padding: '1px 5px',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                          title="Replace uploaded image"
                        >
                          <RefreshCw size={9} />
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => handleItemImageUrlChange(item.id, '')}
                          style={{
                            background: 'var(--error-light)',
                            border: '1px solid var(--error-border)',
                            borderRadius: '4px',
                            padding: '1px 5px',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            color: 'var(--error)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                          title="Remove image"
                        >
                          <X size={9} />
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => document.getElementById(`file-input-${item.id}`)?.click()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        background: 'var(--primary-light)',
                        border: '1.5px dashed var(--primary-border)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--primary)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                      }}
                      title="Upload item image from disk"
                    >
                      <Upload size={13} />
                      Upload
                    </button>
                  )}
                </div>

                {/* Item Name / Label Input */}
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleItemNameChange(item.id, e.target.value)}
                  placeholder={`Item ${idx + 1} label`}
                  className="input-3d"
                  style={{ padding: '6px 10px', fontSize: '0.86rem' }}
                  title="Item name or description"
                />

                {/* Category Dropdown */}
                <select
                  value={item.correctCategoryId}
                  onChange={(e) => handleItemCategoryChange(item.id, e.target.value)}
                  className="input-3d"
                  style={{ padding: '6px 10px', fontSize: '0.86rem', cursor: 'pointer' }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || 'Unnamed Category'}
                    </option>
                  ))}
                </select>

                {/* Remove Item Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--error)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                  }}
                  title="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '10px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Question
          </Button>
        </div>
      </div>
    </Modal>
  );
};
