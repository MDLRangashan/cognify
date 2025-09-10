import { db } from '../config/firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

/**
 * Utility to fix existing quiz data where correctAnswer is stored as index instead of actual value
 */
export const fixQuizCorrectAnswers = async (quizId: string): Promise<boolean> => {
  try {
    console.log(`Fixing quiz data for quiz ID: ${quizId}`);
    
    // Get the current quiz data
    const quizRef = doc(db, 'adminQuizzes', quizId);
    const quizDoc = await getDoc(quizRef);
    
    if (!quizDoc.exists()) {
      console.error('Quiz not found');
      return false;
    }
    
    const quizData = quizDoc.data();
    console.log('Current quiz data:', quizData);
    
    // Fix each question's correctAnswer
    const fixedQuestions = quizData.questions.map((q: any, index: number) => {
      console.log(`Fixing question ${index + 1}:`, {
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        correctAnswerType: typeof q.correctAnswer
      });
      
      // Check if correctAnswer is an index (1-4) instead of actual value
      if (q.correctAnswer >= 1 && q.correctAnswer <= 4 && q.options && q.options.length >= 4) {
        const actualCorrectAnswer = q.options[q.correctAnswer - 1];
        console.log(`⚠️  FIXING: correctAnswer is index ${q.correctAnswer}, should be value ${actualCorrectAnswer}`);
        console.log(`Options: [${q.options.join(', ')}]`);
        console.log(`Index ${q.correctAnswer} = Value ${actualCorrectAnswer}`);
        
        return {
          ...q,
          correctAnswer: actualCorrectAnswer
        };
      }
      
      return q; // No change needed
    });
    
    // Update the quiz with fixed questions
    await updateDoc(quizRef, {
      questions: fixedQuestions,
      updatedAt: new Date()
    });
    
    console.log('✅ Quiz data fixed successfully!');
    return true;
    
  } catch (error) {
    console.error('Error fixing quiz data:', error);
    return false;
  }
};

/**
 * Fix all quizzes that have incorrect correctAnswer format
 */
export const fixAllQuizCorrectAnswers = async (): Promise<void> => {
  try {
    console.log('Starting to fix all quiz correct answers...');
    
    // For now, we'll fix the known problematic quiz
    const problematicQuizId = '2KNRg8RDnTBKzkF6M2RH'; // The quiz ID from the logs
    
    const success = await fixQuizCorrectAnswers(problematicQuizId);
    
    if (success) {
      console.log('✅ All quiz data fixed successfully!');
    } else {
      console.error('❌ Failed to fix quiz data');
    }
    
  } catch (error) {
    console.error('Error fixing all quiz data:', error);
  }
};
