import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Question, QuizQuestion, GameRoom } from '../types/index.js';
import { SEED_QUESTIONS, SEED_QUIZ_QUESTIONS } from './seedQuestions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export interface DatabaseSchema {
  questionTemplates: Question[];
  quizQuestionTemplates: QuizQuestion[];
  games: Record<string, GameRoom>; // roomCode -> GameRoom
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = {
      questionTemplates: [],
      quizQuestionTemplates: [],
      games: {},
    };
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Backfill imageUrl for seed questions if missing
        if (this.data.questionTemplates) {
          const seedMap = new Map<string, string>();
          for (const sq of SEED_QUESTIONS) {
            for (const it of sq.items) {
              if (it.imageUrl) seedMap.set(it.name.toLowerCase(), it.imageUrl);
            }
          }
          for (const q of this.data.questionTemplates) {
            for (const it of q.items) {
              if (!it.imageUrl && seedMap.has(it.name.toLowerCase())) {
                it.imageUrl = seedMap.get(it.name.toLowerCase());
              }
            }
          }
        }
      } else {
        this.data.questionTemplates = [...SEED_QUESTIONS];
        this.data.quizQuestionTemplates = [...SEED_QUIZ_QUESTIONS];
        this.save();
      }

      // If templates were empty, reload seeds
      if (!this.data.questionTemplates || this.data.questionTemplates.length === 0) {
        this.data.questionTemplates = [...SEED_QUESTIONS];
        this.save();
      }
      if (!this.data.quizQuestionTemplates || this.data.quizQuestionTemplates.length === 0) {
        this.data.quizQuestionTemplates = [...SEED_QUIZ_QUESTIONS];
        this.save();
      }
    } catch (err) {
      console.error('Error initializing database:', err);
      this.data = {
        questionTemplates: [...SEED_QUESTIONS],
        quizQuestionTemplates: [...SEED_QUIZ_QUESTIONS],
        games: {},
      };
    }
  }

  public save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  // Question Templates (Categorization)
  public getQuestionTemplates(): Question[] {
    return this.data.questionTemplates;
  }

  public getQuestionTemplateById(id: string): Question | undefined {
    return this.data.questionTemplates.find((q) => q.id === id);
  }

  public saveQuestionTemplate(question: Question): Question {
    const idx = this.data.questionTemplates.findIndex((q) => q.id === question.id);
    if (idx >= 0) {
      this.data.questionTemplates[idx] = question;
    } else {
      this.data.questionTemplates.push(question);
    }
    this.save();
    return question;
  }

  public deleteQuestionTemplate(id: string): boolean {
    const prevLen = this.data.questionTemplates.length;
    this.data.questionTemplates = this.data.questionTemplates.filter((q) => q.id !== id);
    if (this.data.questionTemplates.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  public resetToSeedQuestions(): Question[] {
    this.data.questionTemplates = [...SEED_QUESTIONS];
    this.save();
    return this.data.questionTemplates;
  }

  public reorderQuestionTemplates(questions: Question[]): Question[] {
    this.data.questionTemplates = questions;
    this.save();
    return this.data.questionTemplates;
  }

  // Quiz Question Templates (Quiz Phase)
  public getQuizQuestionTemplates(): QuizQuestion[] {
    return this.data.quizQuestionTemplates || [];
  }

  public getQuizQuestionTemplateById(id: string): QuizQuestion | undefined {
    return (this.data.quizQuestionTemplates || []).find((q) => q.id === id);
  }

  public saveQuizQuestionTemplate(question: QuizQuestion): QuizQuestion {
    if (!this.data.quizQuestionTemplates) {
      this.data.quizQuestionTemplates = [];
    }
    const idx = this.data.quizQuestionTemplates.findIndex((q) => q.id === question.id);
    if (idx >= 0) {
      this.data.quizQuestionTemplates[idx] = question;
    } else {
      this.data.quizQuestionTemplates.push(question);
    }
    this.save();
    return question;
  }

  public deleteQuizQuestionTemplate(id: string): boolean {
    if (!this.data.quizQuestionTemplates) return false;
    const prevLen = this.data.quizQuestionTemplates.length;
    this.data.quizQuestionTemplates = this.data.quizQuestionTemplates.filter((q) => q.id !== id);
    if (this.data.quizQuestionTemplates.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  public resetToSeedQuizQuestions(): QuizQuestion[] {
    this.data.quizQuestionTemplates = [...SEED_QUIZ_QUESTIONS];
    this.save();
    return this.data.quizQuestionTemplates;
  }

  public reorderQuizQuestionTemplates(questions: QuizQuestion[]): QuizQuestion[] {
    this.data.quizQuestionTemplates = questions;
    this.save();
    return this.data.quizQuestionTemplates;
  }

  // Games
  public getGame(roomCode: string): GameRoom | undefined {
    return this.data.games[roomCode.toUpperCase()];
  }

  public saveGame(game: GameRoom) {
    this.data.games[game.roomCode.toUpperCase()] = game;
    this.save();
  }

  public deleteGame(roomCode: string) {
    delete this.data.games[roomCode.toUpperCase()];
    this.save();
  }
}

export const db = new Database();
