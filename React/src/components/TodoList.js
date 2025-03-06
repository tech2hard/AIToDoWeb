import React from 'react';
import TodoItem from './TodoItem';

function TodoList({ todos, onToggle, onDelete, onEdit }) {
  return (
    <ul className="space-y-3 mt-4">
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </ul>
  );
}

export default TodoList;
