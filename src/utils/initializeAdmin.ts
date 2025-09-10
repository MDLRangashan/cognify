import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export const initializeAdminAccount = async () => {
  try {
    // Check if admin account already exists
    const adminDoc = await getDoc(doc(db, 'users', 'admin'));
    
    if (!adminDoc.exists()) {
      // Create admin account data
      const adminData = {
        uid: 'admin',
        email: 'admin@gmail.com',
        role: 'admin' as const,
        firstName: 'System',
        lastName: 'Administrator',
        phoneNumber: '',
        address: '',
        createdAt: new Date()
      };

      // Save admin data to Firestore
      await setDoc(doc(db, 'users', 'admin'), adminData);
      console.log('Admin account initialized successfully');
    } else {
      console.log('Admin account already exists');
    }
  } catch (error) {
    console.error('Error initializing admin account:', error);
  }
};
