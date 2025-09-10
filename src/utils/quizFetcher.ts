import { db } from '../config/firebaseConfig';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface QuizQuestion {
  id: string;
  question: string;
  correctAnswer: number | string;
  operation: string;
  difficulty: string;
  timeLimit?: number;
  questionType?: 'multiple_choice' | 'open_ended';
  options?: number[];
}

export interface AdminQuiz {
  id: string;
  title: string;
  description: string;
  level: 'High' | 'Middle' | 'Low' | 'Initial Assessment';
  category: string;
  questions: QuizQuestion[];
  totalQuestions: number;
  timeLimit: number;
  isActive: boolean;
  order?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export const fetchQuizByLevel = async (level: 'High' | 'Middle' | 'Low' | 'Initial Assessment'): Promise<AdminQuiz | null> => {
  try {
    console.log(`Searching for quiz with level: "${level}"`);
    const quizzesRef = collection(db, 'adminQuizzes');
    
    // First try the optimized query (requires index)
    try {
      const q = query(
        quizzesRef,
        where('level', '==', level),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      console.log('Trying optimized query...');
      const snapshot = await getDocs(q);
      console.log(`Optimized query returned ${snapshot.size} documents`);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        console.log('Found quiz with optimized query:', {
          id: doc.id,
          title: data.title,
          level: data.level,
          isActive: data.isActive,
          questionsCount: data.questions?.length || 0
        });
        
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as AdminQuiz;
      }
    } catch (indexError) {
      console.log('Optimized query failed (index not ready), trying fallback query...');
    }
    
    // Fallback: Get all quizzes with the level and filter in memory
    const fallbackQuery = query(
      quizzesRef,
      where('level', '==', level)
    );
    
    console.log('Executing fallback query...');
    const snapshot = await getDocs(fallbackQuery);
    console.log(`Fallback query returned ${snapshot.size} documents`);
    
    if (snapshot.empty) {
      console.log(`No quiz found for level: ${level}`);
      return null;
    }
    
    // Filter active quizzes and sort by creation date
    const activeQuizzes = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as AdminQuiz;
      })
      .filter(quiz => quiz.isActive === true)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    console.log(`Found ${activeQuizzes.length} active quizzes for level "${level}"`);
    
    if (activeQuizzes.length === 0) {
      console.log(`No active quiz found for level: ${level}`);
      // Show all quizzes for debugging
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        console.log('Quiz found (inactive):', {
          id: doc.id,
          title: data.title,
          level: data.level,
          isActive: data.isActive,
          createdAt: data.createdAt
        });
      });
      return null;
    }
    
    const selectedQuiz = activeQuizzes[0];
    console.log('Found quiz with fallback query:', {
      id: selectedQuiz.id,
      title: selectedQuiz.title,
      level: selectedQuiz.level,
      isActive: selectedQuiz.isActive,
      questionsCount: selectedQuiz.questions?.length || 0
    });
    
    return selectedQuiz;
  } catch (error) {
    console.error(`Error fetching quiz for level ${level}:`, error);
    return null;
  }
};

export const fetchInitialAssessmentQuiz = async (): Promise<AdminQuiz | null> => {
  console.log('Fetching Initial Assessment quiz...');
  const result = await fetchQuizByLevel('Initial Assessment');
  console.log('Initial Assessment quiz result:', result);
  return result;
};

export const fetchLeveledQuiz = async (performanceLevel: 'High' | 'Middle' | 'Low'): Promise<AdminQuiz | null> => {
  return await fetchQuizByLevel(performanceLevel);
};

export const fetchAllQuizzesByLevel = async (level: 'High' | 'Middle' | 'Low'): Promise<AdminQuiz[]> => {
  try {
    console.log(`Fetching all quizzes for level: "${level}"`);
    const quizzesRef = collection(db, 'adminQuizzes');
    const q = query(quizzesRef, where('level', '==', level), where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    
    const quizzes: AdminQuiz[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as AdminQuiz;
    });
    
    // Sort by order field (ascending), fallback to creation date if no order
    return quizzes.sort((a, b) => {
      const orderA = a.order || 0;
      const orderB = b.order || 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  } catch (error) {
    console.error('Error fetching all quizzes by level:', error);
    return [];
  }
};
