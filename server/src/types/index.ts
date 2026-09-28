export type GameStatus =
  | 'WAITING'
  | 'STARTING'
  | 'PLAYING'
  | 'ROUND_COMPLETED'
  | 'NEXT_ROUND'
  | 'GAME_COMPLETED'
  | 'QUIZ_STARTING'
  | 'QUIZ_PLAYING'
  | 'QUIZ_ROUND_COMPLETED'
  | 'QUIZ_COMPLETED';

export type PlayerRoundStatus = 'thinking' | 'submitted' | 'timed_out';

export interface Category {
  id: string;
  name: string;
  colorIndex?: number;
}

export interface Item {
  id: string;
  name: string;
  imageUrl?: string;
  correctCategoryId: string;
}

export interface ItemPublic {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface Question {
  id: string;
  title: string;
  timeLimitSeconds?: number;
  categories: Category[];
  items: Item[];
}

export interface QuestionPublic {
  id: string;
  title: string;
  timeLimitSeconds: number;
  categories: Category[];
  items: ItemPublic[]; // Stripped of correctCategoryId!
}

// QUIZ PHASE TYPES
export interface QuizQuestion {
  id: string;
  imageUrl: string;
  text?: string;
  options: string[]; // 4 or 5 category options
  correctOption: string; // Correct category name
  timeLimitSeconds?: number;
}

export interface QuizQuestionPublic {
  id: string;
  imageUrl: string;
  text?: string;
  options: string[];
  timeLimitSeconds: number;
}

export interface QuizSubmission {
  playerId: string;
  questionIndex: number;
  selectedOption: string;
  isCorrect: boolean;
  completionTimeMs: number;
  scoreAwarded: number;
  submittedAt: number;
}

export interface Player {
  id: string;
  roomCode: string;
  name: string;
  sessionToken: string;
  socketId: string;
  isConnected: boolean;
  totalScore: number;
  joinedAt: number;
}

export interface PlayerSubmission {
  playerId: string;
  roundIndex: number;
  answers: Record<string, string>; // itemId -> categoryId
  completionTimeMs: number;
  correctCount: number;
  wrongCount: number;
  scoreAwarded: number;
  submittedAt: number;
}

export interface GameRoom {
  id: string;
  roomCode: string;
  title: string;
  hostSocketId: string;
  hostToken: string;
  defaultTimeLimitSeconds: number;
  status: GameStatus;
  currentRoundIndex: number;
  roundStartTime: number | null;
  roundDurationSeconds: number;
  isPaused: boolean;
  pausedRemainingSeconds: number | null;
  revealLeaderboard: boolean;
  questions: Question[];
  quizQuestions: QuizQuestion[];
  currentQuizIndex: number;
  quizSubmissions: Record<number, Record<string, QuizSubmission>>; // questionIndex -> { playerId -> QuizSubmission }
  players: Record<string, Player>; // playerId -> Player
  submissions: Record<number, Record<string, PlayerSubmission>>; // roundIndex -> { playerId -> PlayerSubmission }
  createdAt: number;
}

export interface HostLivePlayerRow {
  rank: number;
  playerId: string;
  playerName: string;
  isConnected: boolean;
  status: PlayerRoundStatus;
  correctCount: number;
  wrongCount: number;
  completionTimeMs: number | null;
  roundScore: number;
  totalScore: number;
  selectedOption?: string;
}

export interface HostDashboardState {
  roomCode: string;
  title: string;
  status: GameStatus;
  currentRoundIndex: number;
  totalRounds: number;
  currentQuestion: Question | null;
  timeRemainingSeconds: number;
  isPaused: boolean;
  connectedPlayersCount: number;
  revealLeaderboard: boolean;
  livePlayers: HostLivePlayerRow[];
  quizQuestions?: QuizQuestion[];
  currentQuizIndex?: number;
  currentQuizQuestionIndex?: number;
  totalQuizQuestions?: number;
  currentQuizQuestion?: QuizQuestion | null;
}

export interface PlayerGameState {
  roomCode: string;
  playerName: string;
  status: GameStatus;
  currentRoundIndex: number;
  totalRounds: number;
  currentQuestion: QuestionPublic | null;
  timeRemainingSeconds: number;
  isPaused: boolean;
  playerScore: number;
  playerRoundSubmitted: boolean;
  currentQuizIndex?: number;
  currentQuizQuestionIndex?: number;
  totalQuizQuestions?: number;
  currentQuizQuestion?: QuizQuestionPublic | null;
  playerQuizSubmitted?: boolean;
  playerSelectedOption?: string;
  lastQuizResult?: {
    isCorrect: boolean;
    correctOption: string;
    scoreAwarded: number;
    totalScore: number;
  };
  lastRoundResult?: {
    correctCount: number;
    wrongCount: number;
    completionTimeMs: number;
    scoreAwarded: number;
    totalScore: number;
  };
  finalStats?: {
    totalScore: number;
    totalCorrect: number;
    totalWrong: number;
    totalTimeSeconds: number;
    accuracyPercent: number;
    rank?: number;
  };
  finalLeaderboard?: Array<{
    rank: number;
    name: string;
    score: number;
    accuracyPercent: number;
  }>;
  connectedPlayers?: Array<{
    id: string;
    name: string;
    isConnected: boolean;
  }>;
}
