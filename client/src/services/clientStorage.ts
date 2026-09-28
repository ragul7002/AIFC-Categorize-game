import { Question, QuizQuestion, HostDashboardState, PlayerGameState } from '../types';
import { DEFAULT_QUESTIONS, DEFAULT_QUIZ_QUESTIONS } from '../data/defaultData';

const QUESTIONS_KEY = 'aifc_game_questions';
const QUIZ_QUESTIONS_KEY = 'aifc_game_quiz_questions';
const LOCAL_ROOMS_KEY = 'aifc_local_rooms';

export class ClientStorageService {
  public getQuestions(): Question[] {
    try {
      const stored = localStorage.getItem(QUESTIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading stored questions:', e);
    }
    return DEFAULT_QUESTIONS;
  }

  public saveQuestions(questions: Question[]) {
    try {
      localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
    } catch (e) {
      console.warn('Error saving questions:', e);
    }
  }

  public getQuizQuestions(): QuizQuestion[] {
    try {
      const stored = localStorage.getItem(QUIZ_QUESTIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading stored quiz questions:', e);
    }
    return DEFAULT_QUIZ_QUESTIONS;
  }

  public saveQuizQuestions(quizQuestions: QuizQuestion[]) {
    try {
      localStorage.setItem(QUIZ_QUESTIONS_KEY, JSON.stringify(quizQuestions));
    } catch (e) {
      console.warn('Error saving quiz questions:', e);
    }
  }

  public resetToSeeds(): { questions: Question[]; quizQuestions: QuizQuestion[] } {
    this.saveQuestions(DEFAULT_QUESTIONS);
    this.saveQuizQuestions(DEFAULT_QUIZ_QUESTIONS);
    return { questions: DEFAULT_QUESTIONS, quizQuestions: DEFAULT_QUIZ_QUESTIONS };
  }
}

export const clientStorage = new ClientStorageService();
