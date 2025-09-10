export interface QuizLevel {
  id: number;
  name: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  unlockRequirement: {
    minScore: number;
    minAccuracy: number;
    maxTime?: number; // in seconds
  };
  questions: {
    count: number;
    timeLimit: number; // in seconds
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

export const QUIZ_LEVELS: QuizLevel[] = [
  {
    id: 1,
    name: 'level1',
    title: 'Math Explorer',
    description: 'Start your math adventure! Learn the basics of addition and subtraction.',
    emoji: '🌱',
    color: '#10b981',
    difficulty: 'Easy',
    unlockRequirement: {
      minScore: 0,
      minAccuracy: 0
    },
    questions: {
      count: 10,
      timeLimit: 300,
      operations: ['addition', 'subtraction']
    },
    rewards: {
      points: 100,
      badge: '🌱 Explorer',
      message: 'Welcome to the world of math! You\'re ready to explore!'
    },
    isUnlocked: true,
    isCompleted: false
  },
  {
    id: 2,
    name: 'level2',
    title: 'Number Ninja',
    description: 'Master multiplication and division! Show your ninja skills!',
    emoji: '🥋',
    color: '#3b82f6',
    difficulty: 'Easy',
    unlockRequirement: {
      minScore: 7,
      minAccuracy: 70,
      maxTime: 240
    },
    questions: {
      count: 12,
      timeLimit: 360,
      operations: ['multiplication', 'division']
    },
    rewards: {
      points: 150,
      badge: '🥋 Ninja',
      message: 'Amazing! You\'ve mastered the basics!'
    },
    isUnlocked: false,
    isCompleted: false
  },
  {
    id: 3,
    name: 'level3',
    title: 'Fraction Master',
    description: 'Conquer fractions and decimals! Become a fraction wizard!',
    emoji: '🧙‍♂️',
    color: '#8b5cf6',
    difficulty: 'Medium',
    unlockRequirement: {
      minScore: 9,
      minAccuracy: 75,
      maxTime: 300
    },
    questions: {
      count: 15,
      timeLimit: 420,
      operations: ['fraction', 'decimal']
    },
    rewards: {
      points: 200,
      badge: '🧙‍♂️ Wizard',
      message: 'Incredible! You\'re becoming a math wizard!'
    },
    isUnlocked: false,
    isCompleted: false
  },
  {
    id: 4,
    name: 'level4',
    title: 'Math Warrior',
    description: 'Battle with mixed operations! Prove your warrior skills!',
    emoji: '⚔️',
    color: '#f59e0b',
    difficulty: 'Medium',
    unlockRequirement: {
      minScore: 12,
      minAccuracy: 80,
      maxTime: 360
    },
    questions: {
      count: 18,
      timeLimit: 480,
      operations: ['addition', 'subtraction', 'multiplication', 'division']
    },
    rewards: {
      points: 250,
      badge: '⚔️ Warrior',
      message: 'Outstanding! You\'re a true math warrior!'
    },
    isUnlocked: false,
    isCompleted: false
  },
  {
    id: 5,
    name: 'level5',
    title: 'Problem Solver',
    description: 'Solve word problems and real-world math! Think like a genius!',
    emoji: '🧠',
    color: '#ef4444',
    difficulty: 'Hard',
    unlockRequirement: {
      minScore: 15,
      minAccuracy: 85,
      maxTime: 420
    },
    questions: {
      count: 20,
      timeLimit: 600,
      operations: ['word_problems', 'mixed']
    },
    rewards: {
      points: 300,
      badge: '🧠 Genius',
      message: 'Brilliant! You\'re a math genius!'
    },
    isUnlocked: false,
    isCompleted: false
  },
  {
    id: 6,
    name: 'level6',
    title: 'Math Champion',
    description: 'Face the ultimate challenge! Become the math champion!',
    emoji: '👑',
    color: '#fbbf24',
    difficulty: 'Expert',
    unlockRequirement: {
      minScore: 18,
      minAccuracy: 90,
      maxTime: 480
    },
    questions: {
      count: 25,
      timeLimit: 720,
      operations: ['all', 'advanced']
    },
    rewards: {
      points: 500,
      badge: '👑 Champion',
      message: 'Legendary! You are the Math Champion!'
    },
    isUnlocked: false,
    isCompleted: false
  }
];

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
    } else if (level.id > performance.levelId && !level.isUnlocked) {
      // Check if next levels should be unlocked
      return {
        ...level,
        isUnlocked: checkLevelUnlock(level, performance)
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

export const getNextUnlockedLevel = (levels: QuizLevel[]): QuizLevel | null => {
  return levels.find(level => level.isUnlocked && !level.isCompleted) || null;
};
