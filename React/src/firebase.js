// Import Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from "firebase/firestore"; 
import { getAnalytics } from "firebase/analytics";

// 🔹 Firebase Configuration (Replace with your credentials)
const firebaseConfig = {
  apiKey: "AIzaSyB3wtAjcD4XKYz5GuSLfq-j9R0cBFQzjYA",
  authDomain: "aitodoweb.firebaseapp.com",
  projectId: "aitodoweb",
  storageBucket: "aitodoweb.appspot.com", // 🔹 FIXED storageBucket URL
  messagingSenderId: "59787560126",
  appId: "1:59787560126:web:28474c9d78d03b81670aef",
  measurementId: "G-8343HDG129"
};

// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app); 
const provider = new GoogleAuthProvider(); 
const db = getFirestore(app); 

// 🔹 Sign In Function
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Error", error);
  }
};

// 🔹 Sign Out Function
const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign-Out Error", error);
  }
};

// ✅ Export Firebase utilities
export { auth, db, signInWithGoogle, logOut, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where };
