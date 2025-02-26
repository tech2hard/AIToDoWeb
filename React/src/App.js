import React, { useState } from 'react';
import './App.css';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import TabFilter from './components/TabFilter';
import { v4 as uuidv4 } from 'uuid';



function App() {
  const [todos, setTodos] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'priority'

  // arrow function addTodo will add a item to do 
  const addTodo = (todoData) => {
    if (todoData.text.trim().length === 0) return;
    // ^ Line above prevents addition of emptyTodos.
    const newTodo = {
      id: uuidv4(),
      // id is going to be a random number between 0 and 1 convert it into a string  
      text: todoData.text,
      completed: false,
      category: todoData.category,
      dueDate: todoData.dueDate,
      priority: todoData.priority,
      createdAt: new Date().toISOString(),
    };
    setTodos([...todos, newTodo]);
  };

  // arrow function to toggleTodo will toggle a to do be on or off finds based off the id
  const toggleTodo = (id) => {
    setTodos(
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // arrow function to deleteTodo based on its id.
  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // arrow function to editTodo passed in an id and uddatedTodo based on call. Will set previous todo to the updatedTodo
  const editTodo = (id, updatedTodo) => {
    setTodos(
      todos.map(todo =>
        todo.id === id ? { ...todo, ...updatedTodo } : todo
      )
    );
  };

  //
  const filteredTodos = todos.filter(todo => {
    if (activeTab === 'completed') return todo.completed;
    if (activeTab === 'pending') return !todo.completed;
    return true;
  });

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
  );
}

export default App;
