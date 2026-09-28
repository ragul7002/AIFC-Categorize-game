import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { gameManager } from '../services/gameManager.js';
import { Question } from '../types/index.js';

export const apiRouter = express.Router();

// Health check
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Create a new game room
apiRouter.post('/games', (req: Request, res: Response) => {
  try {
    const { title, questions, defaultTimeLimitSeconds } = req.body;
    let selectedQuestions = questions;

    if (!selectedQuestions || !Array.isArray(selectedQuestions) || selectedQuestions.length === 0) {
      selectedQuestions = db.getQuestionTemplates();
    }

    const { room, hostToken } = gameManager.createRoom(
      title || 'Multiplayer Categorization Game',
      selectedQuestions,
      Number(defaultTimeLimitSeconds) || 35
    );

    res.status(201).json({
      roomCode: room.roomCode,
      id: room.id,
      title: room.title,
      hostToken,
      questionsCount: room.questions.length,
      defaultTimeLimitSeconds: room.defaultTimeLimitSeconds,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create game room' });
  }
});

// Check if room exists and get public info
apiRouter.get('/games/:roomCode', (req: Request, res: Response) => {
  const roomCode = String(req.params.roomCode);
  const room = gameManager.getRoom(roomCode);
  if (!room) {
    return res.status(404).json({ error: 'Game room not found' });
  }

  res.json({
    roomCode: room.roomCode,
    title: room.title,
    status: room.status,
    totalRounds: room.questions.length,
    playerCount: Object.values(room.players).filter((p) => p.isConnected).length,
  });
});

// QUESTION MANAGER ENDPOINTS

// Get all question templates
apiRouter.get('/questions', (req: Request, res: Response) => {
  res.json(db.getQuestionTemplates());
});

// Create new question template
apiRouter.post('/questions', (req: Request, res: Response) => {
  try {
    const { title, categories, items, timeLimitSeconds } = req.body;
    if (!title || !categories || !items) {
      return res.status(400).json({ error: 'Title, categories, and items are required' });
    }

    const newQuestion: Question = {
      id: uuidv4(),
      title,
      timeLimitSeconds: Number(timeLimitSeconds) || 35,
      categories: categories.map((cat: any, idx: number) => ({
        id: cat.id || `cat-${idx + 1}-${Date.now().toString(36)}`,
        name: cat.name,
        colorIndex: idx % 6,
      })),
      items: items.map((it: any) => ({
        id: it.id || `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        name: it.name || '',
        imageUrl: it.imageUrl || '',
        correctCategoryId: it.correctCategoryId,
      })),
    };

    const saved = db.saveQuestionTemplate(newQuestion);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save question' });
  }
});

// Duplicate question
apiRouter.post('/questions/:id/duplicate', (req: Request, res: Response) => {
  const qId = String(req.params.id);
  const existing = db.getQuestionTemplateById(qId);
  if (!existing) {
    return res.status(404).json({ error: 'Question not found' });
  }

  // Generate new IDs for categories and items
  const catIdMap = new Map<string, string>();
  const duplicatedCategories = existing.categories.map((cat, idx) => {
    const newId = `cat-dup-${idx + 1}-${Date.now().toString(36)}`;
    catIdMap.set(cat.id, newId);
    return { ...cat, id: newId };
  });

  const duplicatedItems = existing.items.map((it) => ({
    id: `item-dup-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: it.name,
    imageUrl: it.imageUrl,
    correctCategoryId: catIdMap.get(it.correctCategoryId) || it.correctCategoryId,
  }));

  const duplicated: Question = {
    id: uuidv4(),
    title: `${existing.title} (Copy)`,
    timeLimitSeconds: existing.timeLimitSeconds,
    categories: duplicatedCategories,
    items: duplicatedItems,
  };

  const saved = db.saveQuestionTemplate(duplicated);
  res.status(201).json(saved);
});

// Update question
apiRouter.put('/questions/:id', (req: Request, res: Response) => {
  try {
    const qId = String(req.params.id);
    const { title, categories, items, timeLimitSeconds } = req.body;
    const existing = db.getQuestionTemplateById(qId);
    if (!existing) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const updated: Question = {
      id: qId,
      title: title || existing.title,
      timeLimitSeconds: Number(timeLimitSeconds) || existing.timeLimitSeconds || 35,
      categories: categories || existing.categories,
      items: items || existing.items,
    };

    const saved = db.saveQuestionTemplate(updated);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update question' });
  }
});

// Delete question
apiRouter.delete('/questions/:id', (req: Request, res: Response) => {
  const qId = String(req.params.id);
  const deleted = db.deleteQuestionTemplate(qId);
  if (deleted) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Question not found' });
  }
});

// Reset seeds
apiRouter.post('/questions/reset-seeds', (req: Request, res: Response) => {
  const reset = db.resetToSeedQuestions();
  res.json(reset);
});

// Reorder question templates
apiRouter.put('/questions/reorder', (req: Request, res: Response) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions)) {
      return res.status(400).json({ error: 'Questions array is required' });
    }
    const updated = db.reorderQuestionTemplates(questions);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reorder questions' });
  }
});

// ==========================================
// QUIZ QUESTIONS ENDPOINTS
// ==========================================

// Get all quiz question templates
apiRouter.get('/quiz-questions', (req: Request, res: Response) => {
  res.json(db.getQuizQuestionTemplates());
});

// Create new quiz question template
apiRouter.post('/quiz-questions', (req: Request, res: Response) => {
  try {
    const { imageUrl, text, options, correctOption, timeLimitSeconds } = req.body;
    if (!imageUrl || !options || !Array.isArray(options) || options.length < 2 || !correctOption) {
      return res.status(400).json({ error: 'Image URL, options, and correct option are required' });
    }

    const newQuizQ = {
      id: uuidv4(),
      imageUrl,
      text: text || 'Which category does this belong to?',
      options: options.map((opt: string) => String(opt).trim()).filter(Boolean),
      correctOption: String(correctOption).trim(),
      timeLimitSeconds: Number(timeLimitSeconds) || 20,
    };

    const saved = db.saveQuizQuestionTemplate(newQuizQ);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save quiz question' });
  }
});

// Update quiz question
apiRouter.put('/quiz-questions/:id', (req: Request, res: Response) => {
  try {
    const qId = String(req.params.id);
    const { imageUrl, text, options, correctOption, timeLimitSeconds } = req.body;
    const existing = db.getQuizQuestionTemplateById(qId);
    if (!existing) {
      return res.status(404).json({ error: 'Quiz question not found' });
    }

    const updated = {
      id: qId,
      imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
      text: text !== undefined ? text : existing.text,
      options: Array.isArray(options) ? options.map((opt: string) => String(opt).trim()).filter(Boolean) : existing.options,
      correctOption: correctOption !== undefined ? String(correctOption).trim() : existing.correctOption,
      timeLimitSeconds: Number(timeLimitSeconds) || existing.timeLimitSeconds || 20,
    };

    const saved = db.saveQuizQuestionTemplate(updated);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update quiz question' });
  }
});

// Delete quiz question
apiRouter.delete('/quiz-questions/:id', (req: Request, res: Response) => {
  const qId = String(req.params.id);
  const deleted = db.deleteQuizQuestionTemplate(qId);
  if (deleted) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Quiz question not found' });
  }
});

// Reset seed quiz questions
apiRouter.post('/quiz-questions/reset-seeds', (req: Request, res: Response) => {
  const reset = db.resetToSeedQuizQuestions();
  res.json(reset);
});

// Reorder quiz question templates
apiRouter.put('/quiz-questions/reorder', (req: Request, res: Response) => {
  try {
    const { quizQuestions } = req.body;
    if (!Array.isArray(quizQuestions)) {
      return res.status(400).json({ error: 'Quiz questions array is required' });
    }
    const updated = db.reorderQuizQuestionTemplates(quizQuestions);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reorder quiz questions' });
  }
});
