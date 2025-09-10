// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDVaySoEvu9XdX2Q4Cxo_REAH7eexSltcw",
  authDomain: "cognify-d8caf.firebaseapp.com",
  projectId: "cognify-d8caf",
  storageBucket: "cognify-d8caf.appspot.com",
  messagingSenderId: "584640897280",
  appId: "1:584640897280:web:9225a64d282bc4a19dd3e5",
  measurementId: "G-EFF6F6FT41"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, analytics, storage };