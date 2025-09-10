import { db } from '../config/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

export const createTestPerformanceWithDetailedAnswers = async (childId: string, childName: string) => {
  try {
    console.log('Creating test performance data with detailed answers...');
    
    // Create sample detailed answers
    const detailedAnswers = [
      {
        questionId: 1,
        answer: 15,
        isCorrect: true,
        operation: 'addition',
        difficulty: 'easy',
        timeTaken: 3,
        questionText: '7 + 8 = ?',
        correctAnswer: 15
      },
      {
        questionId: 2,
        answer: 24,
        isCorrect: false,
        operation: 'multiplication',
        difficulty: 'medium',
        timeTaken: 8,
        questionText: '6 × 4 = ?',
        correctAnswer: 24
      },
      {
        questionId: 3,
        answer: 5,
        isCorrect: true,
        operation: 'division',
        difficulty: 'hard',
        timeTaken: 12,
        questionText: '25 ÷ 5 = ?',
        correctAnswer: 5
      },
      {
        questionId: 4,
        answer: 0.75,
        isCorrect: true,
        operation: 'fraction',
        difficulty: 'medium',
        timeTaken: 15,
        questionText: 'What is 3/4 as a decimal?',
        correctAnswer: 0.75
      },
      {
        questionId: 5,
        answer: 12,
        isCorrect: false,
        operation: 'subtraction',
        difficulty: 'easy',
        timeTaken: 4,
        questionText: '18 - 7 = ?',
        correctAnswer: 11
      }
    ];

    // Create test performance document
    const testPerformance = {
      childId: childId,
      childName: childName,
      score: 3,
      totalQuestions: 5,
      accuracy: 60,
      timeTaken: 42,
      category: 'Middle Performer',
      levelId: 1,
      levelName: 'Test Level - Basic Math',
      completedAt: new Date(),
      parentId: 'test-parent-id',
      detailedAnswers: detailedAnswers,
      levelDifficulty: 'Mixed'
    };

    const docRef = await addDoc(collection(db, 'childrenPerformance'), testPerformance);
    console.log('Test performance data created with ID:', docRef.id);
    console.log('Detailed answers included:', detailedAnswers.length, 'questions');
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating test performance data:', error);
    return null;
  }
};

export const createTestAssessmentWithDetailedAnswers = async (childId: string, childName: string) => {
  try {
    console.log('Creating test assessment data with detailed answers...');
    
    // Create sample detailed answers for initial assessment
    const detailedAnswers = [
      {
        questionId: 1,
        answer: 12,
        isCorrect: true,
        operation: 'addition',
        difficulty: 'easy',
        timeTaken: 2,
        questionText: '5 + 7 = ?',
        correctAnswer: 12
      },
      {
        questionId: 2,
        answer: 8,
        isCorrect: true,
        operation: 'addition',
        difficulty: 'easy',
        timeTaken: 3,
        questionText: '3 + 5 = ?',
        correctAnswer: 8
      },
      {
        questionId: 3,
        answer: 15,
        isCorrect: true,
        operation: 'addition',
        difficulty: 'easy',
        timeTaken: 4,
        questionText: '9 + 6 = ?',
        correctAnswer: 15
      },
      {
        questionId: 4,
        answer: 20,
        isCorrect: true,
        operation: 'addition',
        difficulty: 'easy',
        timeTaken: 3,
        questionText: '12 + 8 = ?',
        correctAnswer: 20
      },
      {
        questionId: 5,
        answer: 18,
        isCorrect: true,
        operation: 'addition',
        difficulty: 'easy',
        timeTaken: 2,
        questionText: '11 + 7 = ?',
        correctAnswer: 18
      },
      {
        questionId: 11,
        answer: 24,
        isCorrect: true,
        operation: 'multiplication',
        difficulty: 'medium',
        timeTaken: 5,
        questionText: '3 × 8 = ?',
        correctAnswer: 24
      },
      {
        questionId: 12,
        answer: 35,
        isCorrect: true,
        operation: 'multiplication',
        difficulty: 'medium',
        timeTaken: 6,
        questionText: '5 × 7 = ?',
        correctAnswer: 35
      },
      {
        questionId: 13,
        answer: 42,
        isCorrect: true,
        operation: 'multiplication',
        difficulty: 'medium',
        timeTaken: 7,
        questionText: '6 × 7 = ?',
        correctAnswer: 42
      },
      {
        questionId: 14,
        answer: 28,
        isCorrect: true,
        operation: 'multiplication',
        difficulty: 'medium',
        timeTaken: 5,
        questionText: '4 × 7 = ?',
        correctAnswer: 28
      },
      {
        questionId: 15,
        answer: 36,
        isCorrect: true,
        operation: 'multiplication',
        difficulty: 'medium',
        timeTaken: 6,
        questionText: '6 × 6 = ?',
        correctAnswer: 36
      },
      {
        questionId: 16,
        answer: 4,
        isCorrect: true,
        operation: 'division',
        difficulty: 'hard',
        timeTaken: 8,
        questionText: '20 ÷ 5 = ?',
        correctAnswer: 4
      },
      {
        questionId: 17,
        answer: 6,
        isCorrect: true,
        operation: 'division',
        difficulty: 'hard',
        timeTaken: 9,
        questionText: '30 ÷ 5 = ?',
        correctAnswer: 6
      },
      {
        questionId: 18,
        answer: 3,
        isCorrect: true,
        operation: 'division',
        difficulty: 'hard',
        timeTaken: 7,
        questionText: '15 ÷ 5 = ?',
        correctAnswer: 3
      },
      {
        questionId: 19,
        answer: 8,
        isCorrect: true,
        operation: 'division',
        difficulty: 'hard',
        timeTaken: 10,
        questionText: '40 ÷ 5 = ?',
        correctAnswer: 8
      },
      {
        questionId: 20,
        answer: 2,
        isCorrect: true,
        operation: 'division',
        difficulty: 'hard',
        timeTaken: 8,
        questionText: '10 ÷ 5 = ?',
        correctAnswer: 2
      }
    ];

    // Create test assessment document
    const testAssessment = {
      childId: childId,
      childName: childName,
      score: 15,
      totalQuestions: 15,
      accuracy: 100,
      timeTaken: 90,
      category: 'High Performer',
      levelId: 0,
      levelName: 'Initial Assessment',
      completedAt: new Date(),
      parentId: 'test-parent-id',
      detailedAnswers: detailedAnswers,
      levelDifficulty: 'Mixed'
    };

    const docRef = await addDoc(collection(db, 'childrenPerformance'), testAssessment);
    console.log('Test assessment data created with ID:', docRef.id);
    console.log('Detailed answers included:', detailedAnswers.length, 'questions');
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating test assessment data:', error);
    return null;
  }
};
