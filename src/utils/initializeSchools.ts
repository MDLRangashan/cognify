import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const sampleSchools = [
  {
    name: 'Greenwood Elementary School',
    address: '123 Main Street, Greenwood, CA 90210',
    phoneNumber: '(555) 123-4567',
    email: 'info@greenwoodelementary.edu'
  },
  {
    name: 'Riverside High School',
    address: '456 Oak Avenue, Riverside, CA 90211',
    phoneNumber: '(555) 234-5678',
    email: 'contact@riversidehigh.edu'
  },
  {
    name: 'Sunshine Middle School',
    address: '789 Pine Road, Sunshine, CA 90212',
    phoneNumber: '(555) 345-6789',
    email: 'admin@sunshinemiddle.edu'
  },
  {
    name: 'Mountain View Academy',
    address: '321 Elm Street, Mountain View, CA 90213',
    phoneNumber: '(555) 456-7890',
    email: 'info@mountainviewacademy.edu'
  },
  {
    name: 'Valley Elementary School',
    address: '654 Cedar Lane, Valley, CA 90214',
    phoneNumber: '(555) 567-8901',
    email: 'contact@valleyelementary.edu'
  }
];

export const initializeSchools = async () => {
  try {
    // Check if schools already exist
    const schoolsSnapshot = await getDocs(collection(db, 'schools'));
    
    if (schoolsSnapshot.empty) {
      // Add sample schools
      for (const school of sampleSchools) {
        await addDoc(collection(db, 'schools'), school);
      }
      console.log('Sample schools initialized successfully');
    } else {
      console.log('Schools already exist');
    }
  } catch (error) {
    console.error('Error initializing schools:', error);
  }
};
