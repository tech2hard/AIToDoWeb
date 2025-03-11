import React, { useState } from 'react';
import { motion } from 'framer-motion';
import fetchAIResponse from '../services/openaiService';

function TodoForm({ onAdd }) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState('personal');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [aiContent, setAiContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate AI-powered description
  const handleGenerateDescription = async () => {
    if (!text.trim() && !description.trim()) return; // Ensure at least one input
    setLoading(true);
    const aiResponse = await fetchAIResponse(text, description);
    setAiContent(aiResponse);
    setLoading(false);
  };

  // Submit the form
  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({ 
      text, 
      category, 
      dueDate, 
      priority, 
      description,
      aiContent 
    });

    // Reset form fields after submission
    setText('');
    setCategory('personal');
    setDueDate('');
    setPriority('medium');
    setDescription('');
    setAiContent('');
  };

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit} 
      className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-lg"
    >
      <div className="space-y-4">
        {/* Task Input */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full px-4 py-3 text-lg border-b border-gray-200 focus:border-black focus:outline-none transition-colors"
        />

        {/* Description Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add your description here"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            rows="2"
          />
        </div>

        {/* AI Content Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">AI Suggestions</label>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleGenerateDescription}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? "Generating..." : "Generate"}
            </motion.button>
          </div>
          <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[80px]">
            {aiContent ? (
              <div className="prose prose-sm">
                {aiContent}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">AI suggestions will appear here</p>
            )}
          </div>
        </div>

        {/* Form Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-black appearance-none bg-white"
          >
            <option value="personal">Personal</option>
            <option value="work">Work</option>
            <option value="shopping">Shopping</option>
            <option value="other">Other</option>
          </select>

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-black"
          />

          <select 
            value={priority} 
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-black appearance-none bg-white"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">  
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
          >
            Add Task
          </motion.button>
        </div>
      </div>
    </motion.form>
  );
}

export default TodoForm;
