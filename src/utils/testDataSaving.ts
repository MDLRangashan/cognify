import { db } from '../config/firebaseConfig';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';

export const testDataSaving = async (childId: string) => {
  try {
    console.log('Testing data saving for child:', childId);
    
    // Test saving a sample performance record
    const testPerformance = {
      childId: childId,
      childName: 'Test Child',
      score: 8,
      totalQuestions: 10,
      accuracy: 80,
      timeTaken: 120,
      category: 'High Performer',
      levelId: 1,
      levelName: 'Test Level',
      completedAt: new Date(),
      parentId: 'test-parent-id'
    };
    
    const docRef = await addDoc(collection(db, 'childrenPerformance'), testPerformance);
    console.log('Test performance data saved with ID:', docRef.id);
    
    // Test retrieving the data
    const q = query(
      collection(db, 'childrenPerformance'),
      where('childId', '==', childId),
      orderBy('completedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    console.log('Retrieved documents count:', snapshot.size);
    
    snapshot.forEach((doc) => {
      console.log('Document ID:', doc.id, 'Data:', doc.data());
    });
    
    return true;
  } catch (error) {
    console.error('Error testing data saving:', error);
    return false;
  }
};
