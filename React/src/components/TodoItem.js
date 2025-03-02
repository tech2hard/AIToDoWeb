  import React, { useState } from 'react';

  function TodoItem({ todo, onToggle, onDelete, onEdit }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(todo.text);
    const [editedCategory, setEditedCategory] = useState(todo.category);
    const [editedDueDate, setEditedDueDate] = useState(todo.dueDate);
    const [editedPriority, setEditedPriority] = useState(todo.priority);

    const handleSave = () => {
      onEdit(todo.id, {
        text: editedText,
        category: editedCategory,
        dueDate: editedDueDate,
        priority: editedPriority
      });
      setIsEditing(false);
    };

    const getPriorityColor = (priority) => {
      const colors = {
        high: '#ff4444',
        medium: '#ffbb33',
        low: '#00C851'
      };
      return colors[priority];
    };

    if (isEditing) {
      return (
        <li className="todo-item editing">
          <input
            type="text"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
          />
          <select 
            value={editedCategory}
            onChange={(e) => setEditedCategory(e.target.value)}
          >
            <option value="personal">Personal</option>
            <option value="work">Work</option>
            <option value="shopping">Shopping</option>
            <option value="other">Other</option>
          </select>
          <input
            type="date"
            value={editedDueDate}
            onChange={(e) => setEditedDueDate(e.target.value)}
          />
          <select
            value={editedPriority}
            onChange={(e) => setEditedPriority(e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button onClick={handleSave}>Save</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </li>
      );
    }

    return (
      <li className="todo-item">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
        />
        <span 
          className="todo-text"
          style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
        >
          {todo.text}
        </span>
        <span className="todo-category">{todo.category}</span>
        <span className="todo-date">{new Date(todo.dueDate).toLocaleDateString()}</span>
        <span 
          className="todo-priority"
          style={{ backgroundColor: getPriorityColor(todo.priority) }}
        >
          {todo.priority}
        </span>
        <div className="todo-actions">
          <button onClick={() => setIsEditing(true)}>Edit</button>
          <button onClick={() => onDelete(todo.id)}>Delete</button>
        </div>
      </li>
    );
  }

  export default TodoItem; 