import React, { useState, useEffect } from 'react';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import TabFilter from './components/TabFilter';
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
    <div className="max-w-3xl mx-auto p-6 bg-gray-100 shadow-lg rounded-lg mt-10">
      <h1 className="text-3xl font-bold text-center mb-4 text-blue-600">Todo List</h1>

      {!user ? (
        <div className="flex justify-center">
          <button 
            className="bg-blue-500 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition-all"
            onClick={signInWithGoogle}
          >
            Sign In with Google
          </button>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-lg font-semibold">Welcome, {user.displayName}!</p>
            <button 
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-all"
              onClick={logOut}
            >
              Log Out
            </button>
          </div>

          <TabFilter activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="flex justify-between items-center mb-4">
            <label className="text-lg font-semibold">Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Due Date</option>
              <option value="priority">Priority</option>
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
      )}
    </div>
  );
}

export default App;
