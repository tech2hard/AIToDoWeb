import React from 'react';
import TodoItem from './TodoItem';
import { AnimatePresence } from 'framer-motion';

function TodoList({ todos, onToggle, onDelete, onEdit, currentUserEmail }) {
  return (
    <div className="space-y-4">
      <AnimatePresence>
        {todos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
            currentUserEmail={currentUserEmail}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default TodoList;
