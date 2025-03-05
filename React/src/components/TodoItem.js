import React, { useState } from 'react';

function TodoItem({ todo, onToggle, onDelete, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(todo.text);
  const [editedDescription, setEditedDescription] = useState(todo.description || '');
  const [editedCategory, setEditedCategory] = useState(todo.category);
  const [editedDueDate, setEditedDueDate] = useState(todo.dueDate || '');
  const [editedPriority, setEditedPriority] = useState(todo.priority);

  // Save the edited todo
  const handleSave = () => {
    if (!todo.id) return; // Ensure ID exists before updating

    onEdit(todo.id, {
      text: editedText,
      description: editedDescription,
      category: editedCategory,
      dueDate: editedDueDate,
      priority: editedPriority,
    });
    setIsEditing(false);
  };

  // Cancel editing and restore previous values
  const handleCancel = () => {
    setEditedText(todo.text);
    setEditedCategory(todo.category);
    setEditedDueDate(todo.dueDate || "");
    setEditedPriority(todo.priority);
    setEditedDescription(todo.description || "");
    setIsEditing(false); // Exit editing mode
  };

  // Function to get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      high: '#ff4444',
      medium: '#ffbb33',
      low: '#00C851',
    };
    return colors[priority] || '#ccc'; // Default color if priority is missing
  };

  // If editing, show input fields
  if (isEditing) {
    return (
      <li className="todo-item editing">
        <input
          type="text"
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          placeholder="Task name"
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
        <textarea
          value={editedDescription}
          onChange={(e) => setEditedDescription(e.target.value)}
          placeholder="Add a description..."
        />
        <button onClick={handleSave}>Save</button>
        <button onClick={handleCancel}>Cancel</button>
      </li>
    );
  }

  // Default display mode
  return (
    <li className="todo-item">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => todo.id && onToggle(todo.id)}
      />
      <span 
        className="todo-text"
        style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
      >
        {todo.text}
      </span>
      <span className="todo-category">{todo.category}</span>
      <span className="todo-date">
        {todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : 'No due date'}
      </span>
      <span 
        className="todo-priority"
        style={{ backgroundColor: getPriorityColor(todo.priority) }}
      >
        {todo.priority}
      </span>

      {todo.description && (<p className="todo-description">{todo.description}</p>)}

      <div className="todo-actions">
        <button onClick={() => setIsEditing(true)}>Edit</button>
        <button onClick={() => todo.id && onDelete(todo.id)}>Delete</button>
      </div>
    </li>
  );
}

export default TodoItem;
