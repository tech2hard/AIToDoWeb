/**
 * Firebase Configuration and Utility Functions
 * This file contains all Firebase-related functionality including:
 * - Firebase initialization
 * - Authentication methods
 * - Firestore database operations
 * - User profile management
 * - Todo sharing and permissions
 */

// Import Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, getDoc, setDoc, limit } from "firebase/firestore"; 
import { getAnalytics } from "firebase/analytics";

// Firebase Configuration Object
// Replace these credentials with your own Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyB3wtAjcD4XKYz5GuSLfq-j9R0cBFQzjYA",
  authDomain: "aitodoweb.firebaseapp.com",
  projectId: "aitodoweb",
  storageBucket: "aitodoweb.appspot.com",
  messagingSenderId: "59787560126",
  appId: "1:59787560126:web:28474c9d78d03b81670aef",
  measurementId: "G-8343HDG129"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app); 
const provider = new GoogleAuthProvider(); 
const db = getFirestore(app); 

/**
 * Update or create a user profile in Firestore
 * Creates/updates documents in both userProfiles and users collections
 * @param {Object} user - The Firebase Auth user object
 */
const updateUserProfile = async (user) => {
  if (!user?.email) return;

  try {
    // Update user profile in userProfiles collection
    const userProfileRef = doc(db, 'userProfiles', user.email);
    await setDoc(userProfileRef, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    // Update user document in users collection
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating user profile:', error);
  }
};

/**
 * Sign in with Google
 * Handles Google authentication and creates/updates user profile
 * @returns {Promise<Object>} The authenticated user object
 */
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    await updateUserProfile(result.user);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Error", error);
  }
};

/**
 * Sign out the current user
 * Handles user logout from Firebase Auth
 */
const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign-Out Error", error);
  }
};

/**
 * Check if a user exists in Firebase
 * Searches in both userProfiles and users collections
 * Creates a userProfile if found in users but not in userProfiles
 * @param {string} email - The email to check
 * @returns {Promise<boolean>} Whether the user exists
 */
export const checkUserExists = async (email) => {
  if (!email) return false;
  
  try {
    // Check userProfiles collection first
    const userProfileRef = doc(db, 'userProfiles', email);
    const userProfileDoc = await getDoc(userProfileRef);
    
    if (userProfileDoc.exists()) {
      return true;
    }

    // If not found, check users collection
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Create userProfile if found in users but not in userProfiles
      const userData = querySnapshot.docs[0].data();
      await setDoc(userProfileRef, {
        email: userData.email,
        displayName: userData.displayName || '',
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
};

/**
 * Create a todo invitation
 * Creates an invitation document in the recipient's invited_todos collection
 * @param {string} todoId - The ID of the todo to share
 * @param {string} ownerEmail - The email of the todo owner
 * @param {string} recipientEmail - The email of the recipient
 * @param {string} permission - The permission level (view/edit)
 * @returns {Promise<boolean>} Whether the invitation was created successfully
 */
export const createTodoInvitation = async (todoId, ownerEmail, recipientEmail, permission = 'view') => {
  try {
    // Get the todo data
    const todoDoc = await getDoc(doc(db, 'todos', todoId));
    if (!todoDoc.exists()) {
      throw new Error('Todo not found');
    }

    // Find recipient's user document
    const usersRef = collection(db, 'users');
    const recipientQuery = query(usersRef, where('email', '==', recipientEmail));
    const recipientSnapshot = await getDocs(recipientQuery);
    
    if (recipientSnapshot.empty) {
      throw new Error('Recipient not found');
    }

    const recipientDoc = recipientSnapshot.docs[0];
    const invitedTodosRef = collection(recipientDoc.ref, 'invited_todos');

    // Get original owner's email (for reshared todos)
    const todoData = todoDoc.data();
    const originalOwner = todoData.originalOwner || todoData.owner;

    // Create invitation document
    await addDoc(invitedTodosRef, {
      todoId,
      todoData: todoDoc.data(),
      ownerEmail,
      originalOwner,
      permission,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error creating todo invitation:', error);
    throw error;
  }
};

/**
 * Get pending todo invitations for a user
 * @param {string} userEmail - The email of the user
 * @returns {Promise<Array>} Array of pending invitations
 */
export const getPendingInvitations = async (userEmail) => {
  try {
    const usersRef = collection(db, 'users');
    const userQuery = query(usersRef, where('email', '==', userEmail));
    const userSnapshot = await getDocs(userQuery);
    
    if (userSnapshot.empty) {
      return [];
    }

    const userDoc = userSnapshot.docs[0];
    const invitedTodosRef = collection(userDoc.ref, 'invited_todos');
    const pendingQuery = query(invitedTodosRef, where('status', '==', 'pending'));
    
    const invitationsSnapshot = await getDocs(pendingQuery);
    return invitationsSnapshot.docs.map(doc => ({
      id: doc.id,
      todoId: doc.data().todoId,
      todoData: doc.data().todoData,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return [];
  }
};

/**
 * Handle a todo invitation response
 * Creates a shared todo document if accepted, deletes the invitation
 * @param {string} userEmail - The email of the user responding
 * @param {string} invitationId - The ID of the invitation
 * @param {string} todoId - The ID of the todo
 * @param {boolean} accept - Whether the invitation was accepted
 * @returns {Promise<boolean>} Whether the response was handled successfully
 */
export const handleInvitationResponse = async (userEmail, invitationId, todoId, accept) => {
  try {
    const usersRef = collection(db, 'users');
    const userQuery = query(usersRef, where('email', '==', userEmail));
    const userSnapshot = await getDocs(userQuery);
    
    if (userSnapshot.empty) {
      throw new Error('User not found');
    }

    const userDoc = userSnapshot.docs[0];
    const invitationRef = doc(userDoc.ref, 'invited_todos', invitationId);
    const invitationSnap = await getDoc(invitationRef);

    if (accept && invitationSnap.exists()) {
      // Create shared todo document if accepted
      const sharedTodosRef = collection(userDoc.ref, 'shared_todos');
      await addDoc(sharedTodosRef, {
        todoId,
        todoData: invitationSnap.data().todoData,
        ownerEmail: invitationSnap.data().ownerEmail,
        originalOwner: invitationSnap.data().originalOwner,
        permission: invitationSnap.data().permission,
        addedAt: new Date().toISOString()
      });
    }

    // Delete the invitation
    await deleteDoc(invitationRef);

    return true;
  } catch (error) {
    console.error('Error handling invitation:', error);
    throw error;
  }
};

/**
 * Get all users who have a todo shared with them
 * @param {string} todoId - The ID of the todo
 * @returns {Promise<Array>} Array of shared users with their permissions
 */
export const getSharedUsers = async (todoId) => {
  try {
    // Verify todo exists and user is original owner
    const todoDoc = await getDoc(doc(db, 'todos', todoId));
    if (!todoDoc.exists()) {
      console.error('Todo not found');
      return [];
    }

    const todoData = todoDoc.data();
    const currentUser = auth.currentUser;
    if (!currentUser || todoData.originalOwner !== currentUser.email) {
      console.error('Not authorized to view shared users');
      return [];
    }

    // Get all users who have this todo shared with them
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    // Process each user's shared todos
    const sharedUsersPromises = usersSnapshot.docs.map(async userDoc => {
      const userData = userDoc.data();
      
      // Skip original owner
      if (userData.email === todoData.originalOwner) {
        return null;
      }
      
      const sharedTodosRef = collection(userDoc.ref, 'shared_todos');
      const sharedTodoQuery = query(sharedTodosRef, where('todoId', '==', todoId));
      
      try {
        const sharedTodoSnapshot = await getDocs(sharedTodoQuery);
        
        if (!sharedTodoSnapshot.empty) {
          const sharedTodoDoc = sharedTodoSnapshot.docs[0];
          const sharedData = sharedTodoDoc.data();
          
          return {
            userId: userDoc.id,
            email: userData.email,
            sharedId: sharedTodoDoc.id,
            permission: sharedData.permission,
            addedAt: sharedData.addedAt || new Date().toISOString()
          };
        }
      } catch (error) {
        console.error(`Error checking shared status for user ${userData.email}:`, error);
      }
      
      return null;
    });

    // Process results and sort by when they were added
    const results = await Promise.all(sharedUsersPromises);
    const validSharedUsers = results.filter(user => user !== null);

    return validSharedUsers.sort((a, b) => 
      new Date(b.addedAt || 0) - new Date(a.addedAt || 0)
    );
  } catch (error) {
    console.error('Error fetching shared users:', error);
    return [];
  }
};

/**
 * Revoke a user's access to a shared todo
 * @param {string} userId - The ID of the user
 * @param {string} sharedId - The ID of the shared todo document
 * @returns {Promise<boolean>} Whether the access was revoked successfully
 */
export const revokeAccess = async (userId, sharedId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const sharedTodoRef = doc(userRef, 'shared_todos', sharedId);
    await deleteDoc(sharedTodoRef);
    return true;
  } catch (error) {
    console.error('Error revoking access:', error);
    throw error;
  }
};

/**
 * Update a user's permission for a shared todo
 * @param {string} userEmail - The email of the user
 * @param {string} sharedId - The ID of the shared todo document
 * @param {string} newPermission - The new permission level (view/edit)
 * @returns {Promise<boolean>} Whether the permission was updated successfully
 */
export const updatePermission = async (userEmail, sharedId, newPermission) => {
  try {
    console.log('Updating permission:', { userEmail, sharedId, newPermission });
    
    // Find user document by email
    const usersRef = collection(db, 'users');
    const userQuery = query(usersRef, where('email', '==', userEmail));
    const userSnapshot = await getDocs(userQuery);
    
    if (userSnapshot.empty) {
      throw new Error('User not found');
    }

    const userDoc = userSnapshot.docs[0];
    const sharedTodoRef = doc(userDoc.ref, 'shared_todos', sharedId);
    
    // Verify document exists
    const sharedTodoDoc = await getDoc(sharedTodoRef);
    if (!sharedTodoDoc.exists()) {
      throw new Error('Shared todo document not found');
    }

    // Update permission in both places
    await updateDoc(sharedTodoRef, {
      permission: newPermission,
      'todoData.permission': newPermission
    });

    console.log('Permission updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating permission:', error);
    throw error;
  }
};

// Export Firebase utilities
export { 
  auth, 
  db, 
  signInWithGoogle, 
  logOut, 
  collection, 
  addDoc, 
  getDocs,
  getDoc, 
  setDoc,
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  where 
};
