import { Question, QuizQuestion } from '../types';

export interface ScoreTier {
  maxSeconds: number;
  pointsPerItem: number;
}

export const DEFAULT_SCORE_TIERS: ScoreTier[] = [
  { maxSeconds: 10, pointsPerItem: 100 },
  { maxSeconds: 20, pointsPerItem: 80 },
  { maxSeconds: 30, pointsPerItem: 60 },
  { maxSeconds: 40, pointsPerItem: 40 },
  { maxSeconds: 50, pointsPerItem: 20 },
  { maxSeconds: Infinity, pointsPerItem: 10 },
];

export function getPointsForTime(elapsedSeconds: number, tiers: ScoreTier[] = DEFAULT_SCORE_TIERS): number {
  for (const tier of tiers) {
    if (elapsedSeconds <= tier.maxSeconds) {
      return tier.pointsPerItem;
    }
  }
  return 10;
}

export function calculateSubmissionScore(
  question: Question,
  playerAnswers: Record<string, string>,
  completionTimeMs: number,
  tiers: ScoreTier[] = DEFAULT_SCORE_TIERS
): {
  correctCount: number;
  wrongCount: number;
  scoreAwarded: number;
  pointsPerItem: number;
} {
  const elapsedSeconds = Math.max(0, completionTimeMs / 1000);
  const pointsPerCorrect = getPointsForTime(elapsedSeconds, tiers);

  let correctCount = 0;
  let wrongCount = 0;

  for (const item of question.items) {
    const selectedCategory = playerAnswers[item.id];
    if (selectedCategory && selectedCategory === item.correctCategoryId) {
      correctCount++;
    } else {
      wrongCount++;
    }
  }

  const scoreAwarded = correctCount * pointsPerCorrect;

  return {
    correctCount,
    wrongCount,
    scoreAwarded,
    pointsPerItem: pointsPerCorrect,
  };
}

export function calculateQuizScore(
  question: QuizQuestion,
  selectedOption: string,
  completionTimeMs: number,
  tiers: ScoreTier[] = DEFAULT_SCORE_TIERS
): {
  isCorrect: boolean;
  scoreAwarded: number;
  pointsForSpeed: number;
} {
  const isCorrect = Boolean(
    selectedOption &&
    question.correctOption &&
    selectedOption.trim().toLowerCase() === question.correctOption.trim().toLowerCase()
  );

  const elapsedSeconds = Math.max(0, completionTimeMs / 1000);
  const pointsForSpeed = getPointsForTime(elapsedSeconds, tiers);
  const scoreAwarded = isCorrect ? pointsForSpeed : 0;

  return {
    isCorrect,
    scoreAwarded,
    pointsForSpeed,
  };
}
