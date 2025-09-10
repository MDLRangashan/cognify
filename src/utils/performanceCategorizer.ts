export interface QuizPerformance {
  score: number;
  totalQuestions: number;
  timeTaken: number; // in seconds
  accuracy: number; // percentage
  category: 'High Performer' | 'Middle Performer' | 'Slow Performer';
  message: string;
  emoji: string;
  color: string;
}

export const categorizePerformance = (
  score: number,
  totalQuestions: number,
  timeTaken: number,
  totalTime: number = 300 // 5 minutes default
): QuizPerformance => {
  const accuracy = (score / totalQuestions) * 100;
  const timeEfficiency = ((totalTime - timeTaken) / totalTime) * 100;
  
  // Calculate performance score (weighted: 70% accuracy, 30% time efficiency)
  const performanceScore = (accuracy * 0.7) + (timeEfficiency * 0.3);
  
  let category: 'High Performer' | 'Middle Performer' | 'Slow Performer';
  let message: string;
  let emoji: string;
  let color: string;

  if (performanceScore >= 80) {
    category = 'High Performer';
    message = "Wow! You're absolutely amazing! You solved the problems quickly and accurately! 🌟";
    emoji = "🏆";
    color = "#10b981"; // Green
  } else if (performanceScore >= 60) {
    category = 'Middle Performer';
    message = "Great job! You did really well! Keep practicing to become even better! 💪";
    emoji = "🥈";
    color = "#f59e0b"; // Orange
  } else {
    category = 'Slow Performer';
    message = "Good effort! Don't worry, practice makes perfect! You're doing great! 🌱";
    emoji = "🌱";
    color = "#ef4444"; // Red
  }

  return {
    score,
    totalQuestions,
    timeTaken,
    accuracy,
    category,
    message,
    emoji,
    color
  };
};

export const getPerformanceDetails = (performance: QuizPerformance) => {
  const timeMinutes = Math.floor(performance.timeTaken / 60);
  const timeSeconds = performance.timeTaken % 60;
  const timeString = timeMinutes > 0 ? `${timeMinutes}m ${timeSeconds}s` : `${timeSeconds}s`;

  return {
    ...performance,
    timeString,
    percentage: Math.round(performance.accuracy)
  };
};
