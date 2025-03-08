import React, { useState } from 'react';
import { motion } from 'framer-motion';

function TodoItem({ todo, onToggle, onDelete, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(todo.text);
  const [editedDescription, setEditedDescription] = useState(todo.description || '');
  const [editedAiContent, setEditedAiContent] = useState(todo.aiContent || '');
  const [editedCategory, setEditedCategory] = useState(todo.category);
  const [editedDueDate, setEditedDueDate] = useState(todo.dueDate || '');
  const [editedPriority, setEditedPriority] = useState(todo.priority);

  // Save the edited todo
  const handleSave = () => {
    if (!todo.id || !editedText.trim()) return;
    onEdit(todo.id, {
      text: editedText,
      description: editedDescription,
      aiContent: editedAiContent,
      category: editedCategory,
      dueDate: editedDueDate,
      priority: editedPriority,
    });
    setIsEditing(false);
  };

  // Cancel editing and restore previous values
  const handleCancel = () => {
    setEditedText(todo.text);
    setEditedDescription(todo.description || "");
    setEditedAiContent(todo.aiContent || "");
    setEditedCategory(todo.category);
    setEditedDueDate(todo.dueDate || "");
    setEditedPriority(todo.priority);
    setIsEditing(false);
  };

  // Function to get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      high: '#000000',
      medium: '#666666',
      low: '#999999',
    };
    return colors[priority] || '#cccccc';
  };

  // If editing, show input fields
  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-2xl p-6 mb-4"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            placeholder="Task name"
            className="w-full px-4 py-3 text-lg border-b border-gray-200 focus:border-black focus:outline-none transition-colors"
          />
          
          <div className="space-y-4">
            {/* Description Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Add your description..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                rows="2"
              />
            </div>

            {/* AI Content Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">AI Suggestions</label>
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                <textarea
                  value={editedAiContent}
                  onChange={(e) => setEditedAiContent(e.target.value)}
                  placeholder="AI suggestions will appear here"
                  className="w-full bg-transparent focus:outline-none min-h-[80px]"
                  rows="3"
                />
              </div>
            </div>

            {/* Other Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select 
                value={editedCategory}
                onChange={(e) => setEditedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-black appearance-none bg-white"
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
                className="w-full px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-black"
              />

              <select
                value={editedPriority}
                onChange={(e) => setEditedPriority(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-black appearance-none bg-white"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-200 text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              Save
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default display mode
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border border-gray-200 rounded-2xl p-6 mb-4 transition-colors ${
        todo.completed ? 'bg-gray-50' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => todo.id && onToggle(todo.id)}
          className="mt-1.5 h-5 w-5 rounded border-gray-300 text-black focus:ring-black"
        />

        <div className="flex-grow space-y-3">
          <h3 className={`text-lg font-medium ${todo.completed ? 'line-through text-gray-400' : ''}`}>
            {todo.text}
          </h3>
          
          {/* Description */}
          {todo.description && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">Description:</p>
              <p className="text-gray-600">{todo.description}</p>
            </div>
          )}
          
          {/* AI Content */}
          {todo.aiContent && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">AI Suggestions:</p>
              <div className="bg-gray-50 rounded-lg p-3 text-gray-600">
                {todo.aiContent}
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{todo.category}</span>
            <span>•</span>
            <span style={{ color: getPriorityColor(todo.priority) }}>{todo.priority} priority</span>
            <span>•</span>
            <span>{todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : 'No due date'}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditing(true)}
            className="p-2 text-gray-600 hover:text-black transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => todo.id && onDelete(todo.id)}
            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default TodoItem;
