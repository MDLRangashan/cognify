import { db } from '../config/firebaseConfig';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

export const debugPerformanceData = async (childId: string) => {
  try {
    console.log('=== DEBUGGING PERFORMANCE DATA ===');
    console.log('Child ID:', childId);
    
    // Check childrenPerformance collection
    const performanceQuery = query(
      collection(db, 'childrenPerformance'),
      where('childId', '==', childId),
      orderBy('completedAt', 'desc')
    );
    
    const performanceSnapshot = await getDocs(performanceQuery);
    console.log('Performance documents found:', performanceSnapshot.size);
    
    performanceSnapshot.forEach((doc) => {
      console.log('Performance doc:', {
        id: doc.id,
        data: doc.data()
      });
    });
    
    // Check childrenLevelProgress collection
    const levelProgressQuery = query(
      collection(db, 'childrenLevelProgress'),
      where('childId', '==', childId)
    );
    
    const levelProgressSnapshot = await getDocs(levelProgressQuery);
    console.log('Level progress documents found:', levelProgressSnapshot.size);
    
    levelProgressSnapshot.forEach((doc) => {
      console.log('Level progress doc:', {
        id: doc.id,
        data: doc.data()
      });
    });
    
    // Check childrenAssessment collection
    const assessmentQuery = query(
      collection(db, 'childrenAssessment'),
      where('childId', '==', childId)
    );
    
    const assessmentSnapshot = await getDocs(assessmentQuery);
    console.log('Assessment documents found:', assessmentSnapshot.size);
    
    assessmentSnapshot.forEach((doc) => {
      console.log('Assessment doc:', {
        id: doc.id,
        data: doc.data()
      });
    });
    
    return {
      performanceCount: performanceSnapshot.size,
      levelProgressCount: levelProgressSnapshot.size,
      assessmentCount: assessmentSnapshot.size
    };
    
  } catch (error) {
    console.error('Error debugging performance data:', error);
    return null;
  }
};
