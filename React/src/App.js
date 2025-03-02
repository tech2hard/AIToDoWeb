import React, { useState, useEffect } from 'react';
import './App.css';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import TabFilter from './components/TabFilter';
import { v4 as uuidv4 } from 'uuid';
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
    if (!user) return; // Don't fetch if user is not logged in

    const fetchTodos = async () => {
      try {
        const q = query(collection(db, "todos"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const todosData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTodos(todosData);
      } catch (error) {
        console.error("Error fetching todos:", error);
      }
    };

    fetchTodos();
  }, [user]);

  // Add a new todo and store in Firestore
  const addTodo = async (todoData) => {
    if (!user) return; // Ensure user is logged in
    if (todoData.text.trim().length === 0) return;

    const newTodo = {
      id: uuidv4(),
      text: todoData.text,
      completed: false,
      category: todoData.category,
      dueDate: todoData.dueDate,
      priority: todoData.priority,
      createdAt: new Date().toISOString(),
      userId: user.uid, // Store todo under logged-in user
    };

    try {
      await addDoc(collection(db, "todos"), newTodo);
      setTodos([...todos, newTodo]);
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

  // Sort todos by date or priority
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return 0;
  });

  return (
    <div className="App">
      <h1>Todo List</h1>

      {!user ? (
        <button className='auth-buttons' onClick={signInWithGoogle}>Sign In with Google</button>
      ) : (
        <div>
          <p>Welcome, {user.displayName}!</p>
          <button className = 'auth-buttons' onClick={logOut}>Log Out</button>

          <TabFilter activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="sort-control">
            <label>Sort by: </label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
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
