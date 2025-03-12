// Import Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, getDoc, setDoc, limit } from "firebase/firestore"; 
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

// Function to create or update user profile
const updateUserProfile = async (user) => {
  if (!user?.email) return;

  try {
    const userProfileRef = doc(db, 'userProfiles', user.email);
    await setDoc(userProfileRef, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    // Also create/update the user document
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

// Update the sign in function to create user profile
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    await updateUserProfile(result.user);
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

// Function to check if a user exists in Firebase Auth
export const checkUserExists = async (email) => {
  if (!email) return false;
  
  try {
    // First try to get the user profile directly
    const userProfileRef = doc(db, 'userProfiles', email);
    const userProfileDoc = await getDoc(userProfileRef);
    
    if (userProfileDoc.exists()) {
      return true;
    }

    // If not found in userProfiles, try to find in users collection
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // If found in users collection but not in userProfiles,
      // create the userProfile for future lookups
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
    // Don't throw the error, just return false
    return false;
  }
};

// Create a todo invitation
export const createTodoInvitation = async (todoId, ownerEmail, recipientEmail, permission = 'view') => {
  try {
    // Get the todo data first
    const todoDoc = await getDoc(doc(db, 'todos', todoId));
    if (!todoDoc.exists()) {
      throw new Error('Todo not found');
    }

    // Get the recipient's user document
    const usersRef = collection(db, 'users');
    const recipientQuery = query(usersRef, where('email', '==', recipientEmail));
    const recipientSnapshot = await getDocs(recipientQuery);
    
    if (recipientSnapshot.empty) {
      throw new Error('Recipient not found');
    }

    const recipientDoc = recipientSnapshot.docs[0];
    const invitedTodosRef = collection(recipientDoc.ref, 'invited_todos');

    // Get the original owner's email (if this is a reshare, use the original owner)
    const todoData = todoDoc.data();
    const originalOwner = todoData.originalOwner || todoData.owner;

    // Create the invitation with permissions
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

// Function to get user's pending invitations
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

// Function to handle invitation response
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
      // Add to shared_todos collection with permissions
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

// Function to get shared users for a todo
export const getSharedUsers = async (todoId) => {
  try {
    // Get the todo document first to verify it exists
    const todoDoc = await getDoc(doc(db, 'todos', todoId));
    if (!todoDoc.exists()) {
      console.error('Todo not found');
      return [];
    }

    const todoData = todoDoc.data();
    
    // Verify the current user is the original owner
    const currentUser = auth.currentUser;
    if (!currentUser || todoData.originalOwner !== currentUser.email) {
      console.error('Not authorized to view shared users');
      return [];
    }

    // Get users who have this todo in their shared_todos collection
    const sharedUsers = [];
    
    // Query all users who have this todo shared with them
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    // Process each user
    const sharedUsersPromises = usersSnapshot.docs.map(async userDoc => {
      const userData = userDoc.data();
      
      // Skip if this is the original owner
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

    // Wait for all promises to resolve and filter out null values
    const results = await Promise.all(sharedUsersPromises);
    const validSharedUsers = results.filter(user => user !== null);

    // Sort shared users by when they were added (newest first)
    return validSharedUsers.sort((a, b) => 
      new Date(b.addedAt || 0) - new Date(a.addedAt || 0)
    );
  } catch (error) {
    console.error('Error fetching shared users:', error);
    return [];
  }
};

// Function to revoke user access
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

// Function to update user permission
export const updatePermission = async (userEmail, sharedId, newPermission) => {
  try {
    console.log('Updating permission:', { userEmail, sharedId, newPermission });
    
    // First find the user document by email
    const usersRef = collection(db, 'users');
    const userQuery = query(usersRef, where('email', '==', userEmail));
    const userSnapshot = await getDocs(userQuery);
    
    if (userSnapshot.empty) {
      throw new Error('User not found');
    }

    const userDoc = userSnapshot.docs[0];
    const sharedTodoRef = doc(userDoc.ref, 'shared_todos', sharedId);
    
    // Verify the document exists
    const sharedTodoDoc = await getDoc(sharedTodoRef);
    if (!sharedTodoDoc.exists()) {
      throw new Error('Shared todo document not found');
    }

    // Update both the permission and the todoData.permission
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

// ✅ Export Firebase utilities
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
