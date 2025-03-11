import React, { useState, useEffect } from 'react';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import TubelightNavbar from './components/TubelightNavbar';
import LoginPage from './components/LoginPage';
import { auth, signInWithGoogle, logOut, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from "firebase/firestore";
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [todos, setTodos] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'priority'
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');

  // Track authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch todos for the logged-in user
  useEffect(() => {
    if (!user) return;

    const fetchTodos = async () => {
      if (!user?.uid) return; 
    
      try {
        const q = query(collection(db, "todos"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        const todosData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
    
        setTodos(todosData);
      } catch (error) {
        console.error("Error fetching todos:", error);
      }
    };

    fetchTodos();
  }, [user]);

  // Add a new todo and store it in Firestore
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
      
    };

    try {
      const docRef = await addDoc(collection(db, "todos"), newTodo);
      setTodos([...todos, { id: docRef.id, ...newTodo }]);
      setShowForm(false); // Hide form after successful addition
    } catch (error) {
      console.error("Error adding todo:", error);
    }
  };

  // Toggle todo completion and update Firestore
  const toggleTodo = async (id) => {
    const todo = todos.find(todo => todo.id === id);
    if (!todo) return;

    const updatedTodo = { ...todo, completed: !todo.completed };

    try {
      await updateDoc(doc(db, "todos", id), { completed: updatedTodo.completed });
      setTodos(todos.map(todo => (todo.id === id ? updatedTodo : todo)));
    } catch (error) {
      console.error("Error updating todo:", error);
    }
  };

  // Delete a todo from Firestore
  const deleteTodo = async (id) => {
    if (!id) return;
  
    try {
      await deleteDoc(doc(db, "todos", id));
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  // Edit a todo and update Firestore
  const editTodo = async (id, updatedTodo) => {
    try {
      await updateDoc(doc(db, "todos", id), updatedTodo);
      setTodos(todos.map(todo => (todo.id === id ? { ...todo, ...updatedTodo } : todo)));
    } catch (error) {
      console.error("Error editing todo:", error);
    }
  };

  // Update the filtering logic to include both status and category
  const filteredTodos = todos.filter(todo => {
    // First filter by status (completed/pending)
    const statusFilter = 
      activeTab === 'completed' ? todo.completed :
      activeTab === 'pending' ? !todo.completed :
      true;

    // Then filter by category
    const categoryFilter = 
      filterCategory === 'all' ? true :
      todo.category === filterCategory;

    return statusFilter && categoryFilter;
  });

  // Sorting logic
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = a.dueDate ? new Date(a.dueDate) : new Date(0);
      const dateB = b.dueDate ? new Date(b.dueDate) : new Date(0);
      return dateA - dateB;
    }
    if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-white text-black">
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

            <TodoList 
              todos={sortedTodos} 
              onToggle={toggleTodo} 
              onDelete={deleteTodo}
              onEdit={editTodo}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
