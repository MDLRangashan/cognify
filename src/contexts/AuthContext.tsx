import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { initializeSchools } from '../utils/initializeSchools';

interface UserData {
  uid: string;
  email: string;
  role: 'admin' | 'teacher' | 'parent';
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: string;
  yearsOfExperience?: string;
  currentSchool?: string;
  teacherProofBase64?: string;
  isApproved?: boolean;
  createdAt: Date;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userData: Omit<UserData, 'uid' | 'email' | 'createdAt' | 'teacherProofBase64'>, teacherProofBase64?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateUserProfile: (updates: Partial<Pick<UserData, 'firstName' | 'lastName' | 'phoneNumber' | 'address' | 'yearsOfExperience' | 'currentSchool'>>) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const register = async (
    email: string,
    password: string,
    userData: Omit<UserData, 'uid' | 'email' | 'createdAt' | 'isApproved' | 'teacherProofBase64'>,
    teacherProofBase64?: string | null
  ) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    // 1) Create Firestore user doc FIRST so teacher appears for admin approval even if upload fails
    const baseUserData: UserData = {
      ...userData,
      uid: user.uid,
      email: user.email!,
      isApproved: userData.role === 'teacher' ? false : true,
      createdAt: new Date()
    };

    const cleanedBase = Object.fromEntries(
      Object.entries(baseUserData).filter(([, value]) => value !== undefined)
    ) as UserData;

    try {
      await setDoc(doc(db, 'users', user.uid), cleanedBase);
      console.log('User document created for', cleanedBase.role, cleanedBase.email);
    } catch (err) {
      console.error('Failed to create user document:', err);
      try { await user.delete(); } catch (_) {}
      throw err;
    }

    // 2) Save base64 proof if provided; do NOT fail registration if this part fails
    if (userData.role === 'teacher' && teacherProofBase64) {
      try {
        await setDoc(doc(db, 'users', user.uid), { teacherProofBase64: teacherProofBase64 }, { merge: true });
        console.log('Teacher proof base64 saved');
      } catch (err) {
        console.error('Saving teacher proof base64 failed; registration continues:', err);
      }
    }

    // 3) Ensure we are signed out after registration
    try { await signOut(auth); } catch (_) {}
    setUserData(null);
    localStorage.removeItem('userData');
  };

  const login = async (email: string, password: string) => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    
    // Special handling for admin account
    if (email === 'admin@gmail.com') {
      const adminData: UserData = {
        uid: user.uid,
        email: 'admin@gmail.com',
        role: 'admin',
        firstName: 'System',
        lastName: 'Administrator',
        phoneNumber: '',
        address: '',
        isApproved: true,
        createdAt: new Date()
      };
      
      // Save admin data to Firestore if not exists
      const adminDoc = await getDoc(doc(db, 'users', user.uid));
      if (!adminDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), adminData);
        console.log('Admin data saved to Firestore');
      } else {
        console.log('Admin data already exists in Firestore');
      }
      
      // Initialize schools for admin
      await initializeSchools();
      
      setUserData(adminData);
      localStorage.setItem('userData', JSON.stringify(adminData));
      console.log('Admin user data set:', adminData);
      return;
    }
    
    // Fetch user data from Firestore for regular users
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserData;
      // Block unapproved teachers from logging in
      if (userData.role === 'teacher' && userData.isApproved === false) {
        await signOut(auth);
        const err: any = new Error('Your account is pending admin approval. Please wait for approval before logging in.');
        err.code = 'PENDING_APPROVAL';
        throw err;
      }
      
      setUserData(userData);
      
      // Save to localStorage
      localStorage.setItem('userData', JSON.stringify(userData));
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserData(null);
    localStorage.removeItem('userData');
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('No authenticated user');
    }
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    await updatePassword(auth.currentUser, newPassword);
  };

  const updateUserProfile = async (updates: Partial<Pick<UserData, 'firstName' | 'lastName' | 'phoneNumber' | 'address' | 'yearsOfExperience' | 'currentSchool'>>) => {
    if (!currentUser) {
      throw new Error('No authenticated user');
    }
    const cleaned = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await setDoc(doc(db, 'users', currentUser.uid), cleaned, { merge: true });
    const merged = { ...(userData as UserData), ...(cleaned as any) } as UserData;
    setUserData(merged);
    localStorage.setItem('userData', JSON.stringify(merged));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        console.log('Auth state changed - user:', user);
        setCurrentUser(user);
        
        if (user) {
          console.log('User is authenticated, loading user data...');
          console.log('User email:', user.email);
          
          // Special handling for admin account
          if (user.email === 'admin@gmail.com') {
            console.log('Admin account detected, creating admin data...');
            const adminData: UserData = {
              uid: user.uid,
              email: 'admin@gmail.com',
              role: 'admin',
              firstName: 'System',
              lastName: 'Administrator',
              phoneNumber: '',
              address: '',
              isApproved: true,
              createdAt: new Date()
            };
            
            // Save admin data to Firestore if not exists
            const adminDoc = await getDoc(doc(db, 'users', user.uid));
            if (!adminDoc.exists()) {
              await setDoc(doc(db, 'users', user.uid), adminData);
              console.log('Admin data saved to Firestore');
            } else {
              console.log('Admin data already exists in Firestore');
            }
            
            // Initialize schools for admin
            await initializeSchools();
            
            setUserData(adminData);
            localStorage.setItem('userData', JSON.stringify(adminData));
            console.log('Admin user data set:', adminData);
          } else {
            // Check localStorage first for regular users
            const savedUserData = localStorage.getItem('userData');
            console.log('Saved user data from localStorage:', savedUserData);
            
            if (savedUserData) {
              const userData = JSON.parse(savedUserData);
              console.log('Parsed user data:', userData);
              console.log('Setting user data from localStorage');
              setUserData(userData);
            } else {
              console.log('No saved user data, fetching from Firestore...');
              // Fetch from Firestore
              const userDoc = await getDoc(doc(db, 'users', user.uid));
              console.log('Firestore user doc exists:', userDoc.exists());
              
              if (userDoc.exists()) {
                const userData = userDoc.data() as UserData;
                console.log('User data from Firestore:', userData);
                // If unapproved teacher, sign out and persist friendly message for Login page
                if (userData.role === 'teacher' && userData.isApproved === false) {
                  try {
                    await signOut(auth);
                  } catch (_) {}
                  setUserData(null);
                  localStorage.removeItem('userData');
                  localStorage.setItem('loginError', 'Your account is pending admin approval. Please wait for approval before logging in.');
                } else {
                  console.log('Setting user data from Firestore');
                  setUserData(userData);
                  localStorage.setItem('userData', JSON.stringify(userData));
                }
              } else {
                console.log('No user document found in Firestore');
                setUserData(null);
              }
            }
          }
        } else {
          console.log('No user authenticated');
          setUserData(null);
          localStorage.removeItem('userData');
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        // Set loading to false even if there's an error
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    });

    // Set a timeout to ensure loading is set to false
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const value: AuthContextType = {
    currentUser,
    userData,
    login,
    register,
    logout,
    resetPassword,
    changePassword,
    updateUserProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
