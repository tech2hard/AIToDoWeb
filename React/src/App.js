/**
 * Main App Component
 * Handles the core application logic including:
 * - User authentication
 * - Todo management (CRUD operations)
 * - Filtering and sorting
 * - Sharing functionality
 * - UI state management
 */

import React, { useState, useEffect } from 'react';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import TubelightNavbar from './components/TubelightNavbar';
import LoginPage from './components/LoginPage';
import { auth, signInWithGoogle, logOut, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from "firebase/firestore";
import { motion, AnimatePresence } from 'framer-motion';
import InvitationsModal from './components/InvitationsModal';
import { getPendingInvitations } from './firebase';

function App() {
  // State management for todos and UI
  const [todos, setTodos] = useState([]); // List of all todos (owned + shared)
  const [activeTab, setActiveTab] = useState('all'); // Current filter tab (all/pending/completed)
  const [sortBy, setSortBy] = useState('date'); // Current sort method (date/priority)
  const [user, setUser] = useState(null); // Current authenticated user
  const [showForm, setShowForm] = useState(false); // Toggle for new todo form
  const [filterCategory, setFilterCategory] = useState('all'); // Current category filter
  const [invitations, setInvitations] = useState([]); // List of pending todo invitations
  const [showInvitations, setShowInvitations] = useState(false); // Toggle for invitations modal

  /**
   * Authentication State Observer
   * Updates the user state whenever the authentication state changes
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  /**
   * Todo Fetching Effect
   * Fetches both owned and shared todos when the user logs in
   * - Fetches todos owned by the user from the todos collection
   * - Fetches shared todos from the user's shared_todos subcollection
   */
  useEffect(() => {
    if (!user) return;

    const fetchTodos = async () => {
      if (!user?.uid) return; 
    
      try {
        // Fetch todos owned by the current user
        const ownedTodosQuery = query(collection(db, "todos"), 
          where("userId", "==", user.uid)
        );
        const ownedTodosSnapshot = await getDocs(ownedTodosQuery);
        const ownedTodos = ownedTodosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isOwner: true
        }));

        // Fetch todos shared with the current user
        const userRef = doc(db, 'users', user.uid);
        const sharedTodosRef = collection(userRef, 'shared_todos');
        const sharedTodosSnapshot = await getDocs(sharedTodosRef);

        // Transform shared todos data
        const sharedTodos = sharedTodosSnapshot.docs.map(doc => ({
          id: doc.data().todoId,
          ...doc.data().todoData,
          isShared: true,
          sharedId: doc.id,
          ownerEmail: doc.data().ownerEmail,
          originalOwner: doc.data().originalOwner,
          permission: doc.data().permission
        }));

        // Combine owned and shared todos
        setTodos([...ownedTodos, ...sharedTodos]);
      } catch (error) {
        console.error("Error fetching todos:", error);
      }
    };

    fetchTodos();
  }, [user]);

  /**
   * Invitations Fetching Effect
   * Fetches pending todo invitations when the user logs in
   */
  useEffect(() => {
    if (!user?.email) return;

    const fetchInvitations = async () => {
      const pendingInvitations = await getPendingInvitations(user.email);
      setInvitations(pendingInvitations);
      if (pendingInvitations.length > 0) {
        setShowInvitations(true);
      }
    };

    fetchInvitations();
  }, [user]);

  /**
   * Add a new todo
   * Creates a new todo in Firestore and updates the local state
   * @param {Object} todoData - The todo data to be added
   */
  const addTodo = async (todoData) => {
    if (!user || todoData.text.trim().length === 0) return;

    const newTodo = {
      text: todoData.text,
      description: todoData.description,
      completed: false,
      category: todoData.category,
      dueDate: todoData.dueDate,
      priority: todoData.priority,
      createdAt: new Date().toISOString(),
      userId: user.uid,
      owner: user.email,
      originalOwner: user.email,
    };

    try {
      const docRef = await addDoc(collection(db, "todos"), newTodo);
      setTodos([{ id: docRef.id, ...newTodo }, ...todos]);
      setShowForm(false);
    } catch (error) {
      console.error("Error adding todo:", error);
    }
  };

  /**
   * Toggle todo completion status
   * Updates the completion status in Firestore and local state
   * Handles both owned and shared todos with proper permission checks
   * @param {string} id - The ID of the todo to toggle
   */
  const toggleTodo = async (id) => {
    const todo = todos.find(todo => todo.id === id);
    if (!todo) return;

    // Prevent toggling shared todos with view-only permission
    if (todo.isShared && todo.permission === 'view') return;

    try {
      const updatedTodo = { ...todo, completed: !todo.completed };
      
      if (todo.isShared) {
        // Update shared todo in user's shared_todos collection
        const userRef = doc(db, 'users', user.uid);
        const sharedTodoRef = doc(userRef, 'shared_todos', todo.sharedId);
        await updateDoc(sharedTodoRef, {
          'todoData.completed': updatedTodo.completed
        });
      } else {
        // Update original todo in todos collection
        await updateDoc(doc(db, 'todos', id), { completed: updatedTodo.completed });
      }

      setTodos(todos.map(t => (t.id === id ? updatedTodo : t)));
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  /**
   * Delete a todo
   * Removes the todo from Firestore and local state
   * Handles both owned and shared todos differently
   * @param {string} id - The ID of the todo to delete
   * @param {boolean} isShared - Whether the todo is shared
   * @param {string} sharedId - The ID of the shared todo document
   */
  const deleteTodo = async (id, isShared, sharedId) => {
    if (!id || !user?.uid) return;
  
    try {
      if (isShared && sharedId) {
        // Remove shared todo from user's shared_todos collection
        const userRef = doc(db, 'users', user.uid);
        const sharedTodoRef = doc(userRef, 'shared_todos', sharedId);
        await deleteDoc(sharedTodoRef);
        setTodos(todos.filter(todo => todo.sharedId !== sharedId));
      } else {
        // Remove owned todo from todos collection
        await deleteDoc(doc(db, "todos", id));
        setTodos(todos.filter(todo => !todo.isShared && todo.id !== id));
      }
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  /**
   * Edit a todo
   * Updates the todo in Firestore and local state
   * Includes permission checks for shared todos
   * @param {string} id - The ID of the todo to edit
   * @param {Object} updatedTodo - The updated todo data
   */
  const editTodo = async (id, updatedTodo) => {
    const todo = todos.find(todo => todo.id === id);
    if (!todo) return;

    // Prevent editing shared todos with view-only permission
    if (todo.isShared && todo.permission === 'view') return;

    try {
      await updateDoc(doc(db, "todos", id), updatedTodo);
      setTodos(todos.map(todo => (todo.id === id ? { ...todo, ...updatedTodo } : todo)));
    } catch (error) {
      console.error("Error editing todo:", error);
    }
  };

  /**
   * Filter todos based on completion status and category
   * @returns {Array} Filtered todos array
   */
  const filteredTodos = todos.filter(todo => {
    // Filter by completion status
    const statusFilter = 
      activeTab === 'completed' ? todo.completed :
      activeTab === 'pending' ? !todo.completed :
      true;

    // Filter by category
    const categoryFilter = 
      filterCategory === 'all' ? true :
      todo.category === filterCategory;

    return statusFilter && categoryFilter;
  });

  /**
   * Sort todos based on selected sorting method
   * @returns {Array} Sorted todos array
   */
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (sortBy === 'date') {
      // Sort by due date if available, otherwise by creation date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      const createdAtA = new Date(a.createdAt);
      const createdAtB = new Date(b.createdAt);
      return createdAtB - createdAtA;
    }
    if (sortBy === 'priority') {
      // Sort by priority, with secondary sort by creation date
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
      if (priorityDiff === 0) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return priorityDiff;
    }
    // Default sort by creation date (newest first)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  /**
   * Handle invitation response
   * Refreshes the invitations list after handling an invitation
   */
  const handleInvitationResponse = async () => {
    if (!user?.email) return;
    const pendingInvitations = await getPendingInvitations(user.email);
    setInvitations(pendingInvitations);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!user ? (
        <LoginPage onLogin={signInWithGoogle} />
      ) : (
        <div className="max-w-3xl mx-auto px-6 pt-8">
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <h1 className="text-4xl font-bold tracking-tight mb-1">
                Taskly
              </h1>
              <div className="h-1 w-16 bg-black mx-auto rounded-full"/>
            </motion.div>
            
            <h2 className="text-2xl font-bold mb-4">Welcome, {user.displayName}</h2>
            <button 
              onClick={logOut}
              className="px-4 py-2 text-sm bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              Log Out
            </button>
          </div>

          <TubelightNavbar currentFilter={activeTab} onFilterChange={setActiveTab} />
          
          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowForm(!showForm)}
                className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <span>{showForm ? 'Cancel' : 'New Task'}</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${showForm ? 'rotate-45' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </motion.button>

              <div className="flex gap-2">
                <select 
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="all">All Categories</option>
                  <option value="personal">Personal</option>
                  <option value="work">Work</option>
                  <option value="shopping">Shopping</option>
                  <option value="other">Other</option>
                </select>

                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="date">Sort by Date</option>
                  <option value="priority">Sort by Priority</option>
                </select>
              </div>
            </div>

            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <TodoForm onAdd={addTodo} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notification Badge */}
            {invitations.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowInvitations(true)}
                className="fixed top-4 right-4 bg-black text-white px-4 py-2 rounded-full shadow-lg"
              >
                {invitations.length} Pending Invitation{invitations.length !== 1 ? 's' : ''}
              </motion.button>
            )}

            {/* Invitations Modal */}
            <InvitationsModal
              isOpen={showInvitations}
              onClose={() => setShowInvitations(false)}
              invitations={invitations}
              userEmail={user.email}
              onInvitationHandled={handleInvitationResponse}
            />

            <TodoList 
              todos={sortedTodos} 
              onToggle={toggleTodo} 
              onDelete={(id, isShared, sharedId) => deleteTodo(id, isShared, sharedId)}
              onEdit={editTodo}
              currentUserEmail={user.email}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
