export interface PerformanceCategory {
  id: 'high' | 'middle' | 'slow';
  name: string;
  description: string;
  emoji: string;
  color: string;
  quizProgression: QuizLevel[];
}

export interface QuizLevel {
  id: number;
  name: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  category: 'high' | 'middle' | 'slow';
  levelInCategory: number;
  unlockRequirement: {
    minScore: number;
    minAccuracy: number;
    maxTime?: number;
  };
  questions: {
    count: number;
    timeLimit: number;
    operations: string[];
  };
  rewards: {
    points: number;
    badge: string;
    message: string;
  };
  isUnlocked: boolean;
  isCompleted: boolean;
  bestScore?: number;
  bestAccuracy?: number;
  completionTime?: number;
}

// High Performer Quiz Levels (6 adventures)
const HIGH_PERFORMER_LEVELS: QuizLevel[] = Array.from({ length: 6 }, (_, index) => ({
  id: index + 1,
  name: `high_adventure_${index + 1}`,
  title: `Adventure ${index + 1}`,
  description: `Complete this adventure to unlock the next challenge!`,
  emoji: ['🚀', '⚡', '🧮', '🧠', '👑', '🌟'][index],
  color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'][index],
  difficulty: ['Easy', 'Easy', 'Medium', 'Medium', 'Hard', 'Expert'][index] as 'Easy' | 'Medium' | 'Hard' | 'Expert',
  category: 'high',
  levelInCategory: index + 1,
  unlockRequirement: { 
    minScore: index === 0 ? 0 : 10 + (index * 2), 
    minAccuracy: index === 0 ? 0 : 70 + (index * 5),
    maxTime: index === 0 ? undefined : 300 + (index * 60)
  },
  questions: { count: 10 + (index * 2), timeLimit: 300 + (index * 60), operations: ['addition', 'subtraction', 'multiplication', 'division'] },
  rewards: { 
    points: 100 + (index * 50), 
    badge: `Adventure ${index + 1}`, 
    message: `Great job completing Adventure ${index + 1}!` 
  },
  isUnlocked: index === 0,
  isCompleted: false
}));

// Middle Performer Quiz Levels (9 adventures)
const MIDDLE_PERFORMER_LEVELS: QuizLevel[] = Array.from({ length: 9 }, (_, index) => ({
  id: index + 1,
  name: `middle_adventure_${index + 1}`,
  title: `Adventure ${index + 1}`,
  description: `Complete this adventure to unlock the next challenge!`,
  emoji: ['🏗️', '✖️', '🥧', '🔍', '⚔️', '🎯', '📊', '🔢', '🌟'][index],
  color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#a855f7', '#ec4899'][index],
  difficulty: ['Easy', 'Easy', 'Easy', 'Medium', 'Medium', 'Medium', 'Hard', 'Hard', 'Expert'][index] as 'Easy' | 'Medium' | 'Hard' | 'Expert',
  category: 'middle',
  levelInCategory: index + 1,
  unlockRequirement: { 
    minScore: index === 0 ? 0 : 8 + (index * 1), 
    minAccuracy: index === 0 ? 0 : 60 + (index * 3),
    maxTime: index === 0 ? undefined : 360 + (index * 30)
  },
  questions: { count: 8 + (index * 1), timeLimit: 360 + (index * 30), operations: ['addition', 'subtraction', 'multiplication', 'division'] },
  rewards: { 
    points: 80 + (index * 30), 
    badge: `Adventure ${index + 1}`, 
    message: `Great job completing Adventure ${index + 1}!` 
  },
  isUnlocked: index === 0,
  isCompleted: false
}));

// Slow Performer Quiz Levels (12 adventures)
const SLOW_PERFORMER_LEVELS: QuizLevel[] = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  name: `slow_adventure_${index + 1}`,
  title: `Adventure ${index + 1}`,
  description: `Complete this adventure to unlock the next challenge!`,
  emoji: ['🔢', '➕', '➖', '🔄', '✖️', '➗', '📈', '🥧', '🎯', '📊', '🔢', '🌟'][index],
  color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#a855f7', '#ec4899', '#f97316', '#22c55e', '#8b5cf6'][index],
  difficulty: ['Easy', 'Easy', 'Easy', 'Easy', 'Easy', 'Easy', 'Medium', 'Medium', 'Medium', 'Hard', 'Hard', 'Expert'][index] as 'Easy' | 'Medium' | 'Hard' | 'Expert',
  category: 'slow',
  levelInCategory: index + 1,
  unlockRequirement: { 
    minScore: index === 0 ? 0 : 5 + (index * 1), 
    minAccuracy: index === 0 ? 0 : 50 + (index * 2),
    maxTime: index === 0 ? undefined : 480 + (index * 20)
  },
  questions: { count: 6 + (index * 1), timeLimit: 480 + (index * 20), operations: ['addition', 'subtraction', 'multiplication', 'division'] },
  rewards: { 
    points: 50 + (index * 25), 
    badge: `Adventure ${index + 1}`, 
    message: `Great job completing Adventure ${index + 1}!` 
  },
  isUnlocked: index === 0,
  isCompleted: false
}));

export const PERFORMANCE_CATEGORIES: PerformanceCategory[] = [
  {
    id: 'high',
    name: 'High Performer',
    description: 'You\'re a math superstar! Ready for advanced challenges!',
    emoji: '🌟',
    color: '#10b981',
    quizProgression: HIGH_PERFORMER_LEVELS
  },
  {
    id: 'middle',
    name: 'Middle Performer',
    description: 'You\'re doing great! Let\'s build your skills step by step!',
    emoji: '💪',
    color: '#f59e0b',
    quizProgression: MIDDLE_PERFORMER_LEVELS
  },
  {
    id: 'slow',
    name: 'Slow Performer',
    description: 'Don\'t worry! We\'ll take it slow and help you improve!',
    emoji: '🌱',
    color: '#ef4444',
    quizProgression: SLOW_PERFORMER_LEVELS
  }
];

export const getPerformanceCategory = (performance: {
  score: number;
  accuracy: number;
  timeTaken: number;
  totalQuestions: number;
}): PerformanceCategory => {
  const { score, accuracy, timeTaken, totalQuestions } = performance;
  const timeEfficiency = ((300 - timeTaken) / 300) * 100; // Assuming 5 min max
  const performanceScore = (accuracy * 0.7) + (timeEfficiency * 0.3);
  
  console.log('Performance categorization:', {
    score,
    accuracy,
    timeTaken,
    timeEfficiency,
    performanceScore,
    totalQuestions
  });
  
  if (performanceScore >= 80) {
    console.log('Categorized as: High Performer');
    return PERFORMANCE_CATEGORIES[0]; // High Performer
  } else if (performanceScore >= 60) {
    console.log('Categorized as: Middle Performer');
    return PERFORMANCE_CATEGORIES[1]; // Middle Performer
  } else {
    console.log('Categorized as: Slow Performer');
    return PERFORMANCE_CATEGORIES[2]; // Slow Performer
  }
};

export const getLevelsForCategory = (categoryId: 'high' | 'middle' | 'slow'): QuizLevel[] => {
  const category = PERFORMANCE_CATEGORIES.find(cat => cat.id === categoryId);
  return category ? category.quizProgression : SLOW_PERFORMER_LEVELS;
};

// Function to update level details with admin quiz data
export const updateLevelWithAdminQuiz = (level: QuizLevel, adminQuiz: any): QuizLevel => {
  if (!adminQuiz) return level;
  
  return {
    ...level,
    title: adminQuiz.title || level.title,
    description: adminQuiz.description || level.description,
    questions: {
      count: adminQuiz.questions?.length || level.questions.count,
      timeLimit: (adminQuiz.timeLimit || level.questions.timeLimit) * 60, // Convert minutes to seconds
      operations: level.questions.operations // Keep original operations for compatibility
    },
    rewards: {
      points: adminQuiz.points || level.rewards.points,
      badge: adminQuiz.badge || level.rewards.badge,
      message: adminQuiz.message || level.rewards.message
    }
  };
};

export const checkLevelUnlock = (level: QuizLevel, performance: {
  score: number;
  accuracy: number;
  timeTaken: number;
}): boolean => {
  const { minScore, minAccuracy, maxTime } = level.unlockRequirement;
  
  return (
    performance.score >= minScore &&
    performance.accuracy >= minAccuracy &&
    (maxTime ? performance.timeTaken <= maxTime : true)
  );
};

export const updateLevelProgress = (levels: QuizLevel[], performance: {
  score: number;
  accuracy: number;
  timeTaken: number;
  levelId: number;
}): QuizLevel[] => {
  return levels.map(level => {
    if (level.id === performance.levelId) {
      // Mark current level as completed
      return {
        ...level,
        isCompleted: true,
        bestScore: Math.max(level.bestScore || 0, performance.score),
        bestAccuracy: Math.max(level.bestAccuracy || 0, performance.accuracy),
        completionTime: Math.min(level.completionTime || Infinity, performance.timeTaken)
      };
    } else if (level.id === performance.levelId + 1) {
      // Unlock the next level immediately after completing current one
      return {
        ...level,
        isUnlocked: true
      };
    }
    return level;
  });
};

export const getTotalPoints = (levels: QuizLevel[]): number => {
  return levels
    .filter(level => level.isCompleted)
    .reduce((total, level) => total + level.rewards.points, 0);
};

export const getCompletedLevels = (levels: QuizLevel[]): number => {
  return levels.filter(level => level.isCompleted).length;
};
