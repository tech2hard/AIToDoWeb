import React, { useState, useEffect } from 'react';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import TubelightNavbar from './components/TubelightNavbar';
import LoginPage from './components/LoginPage';
import { auth, signInWithGoogle, logOut, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from "firebase/firestore";

function App() {
  const [todos, setTodos] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'priority'
  const [user, setUser] = useState(null);

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

  // Filter todos based on the selected tab
  const filteredTodos = todos.filter(todo => {
    if (activeTab === 'completed') return todo.completed;
    if (activeTab === 'pending') return !todo.completed;
    return true;
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
        <div className="relative pt-24">
          <TubelightNavbar currentFilter={activeTab} onFilterChange={setActiveTab} />
          
          <div className="max-w-3xl mx-auto px-6">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold">Welcome, {user.displayName}</h1>
              <button 
                onClick={logOut}
                className="px-4 py-2 text-sm bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
              >
                Log Out
              </button>
            </div>

            <div className="flex justify-end mb-6">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="date">Sort by Date</option>
                <option value="priority">Sort by Priority</option>
              </select>
            </div>

            <TodoForm onAdd={addTodo} />
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
