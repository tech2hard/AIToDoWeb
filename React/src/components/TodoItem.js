import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkUserExists, createTodoInvitation, getSharedUsers, revokeAccess, updatePermission } from '../firebase';

function TodoItem({ todo, onToggle, onDelete, onEdit, currentUserEmail }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareError, setShareError] = useState('');
  const [sharePermission, setSharePermission] = useState('view');
  const [showTooltip, setShowTooltip] = useState(false);
  const [editedText, setEditedText] = useState(todo.text);
  const [editedDescription, setEditedDescription] = useState(todo.description || '');
  const [editedCategory, setEditedCategory] = useState(todo.category || 'personal');
  const [editedDueDate, setEditedDueDate] = useState(todo.dueDate || '');
  const [editedPriority, setEditedPriority] = useState(todo.priority || 'medium');
  const [isLoading, setIsLoading] = useState(false);
  const [showSharedUsers, setShowSharedUsers] = useState(false);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [updatingPermission, setUpdatingPermission] = useState(null);

  // Fetch shared users when showSharedUsers is toggled
  useEffect(() => {
    if (showSharedUsers && todo.originalOwner === currentUserEmail) {
      console.log('Fetching shared users for todo:', todo.id);
      console.log('Current user:', currentUserEmail);
      console.log('Original owner:', todo.originalOwner);
      
      setIsLoadingUsers(true);
      getSharedUsers(todo.id)
        .then(users => {
          console.log('Fetched shared users:', users);
          setSharedUsers(users);
        })
        .catch(error => {
          console.error('Error fetching shared users:', error);
        })
        .finally(() => setIsLoadingUsers(false));
    }
  }, [showSharedUsers, todo.id, currentUserEmail, todo.originalOwner]);

  const handleShare = async (e) => {
    e.preventDefault();
    setShareError('');
    setIsLoading(true);

    try {
      if (!shareEmail.trim()) {
        setShareError('Please enter an email address');
        return;
      }

      // Check if user exists
      const exists = await checkUserExists(shareEmail);
      if (!exists) {
        setShareError('That email address is invalid.');
        return;
      }

      // Create invitation with permissions
      await createTodoInvitation(todo.id, currentUserEmail, shareEmail, sharePermission);
      setShareEmail('');
      setIsSharing(false);
    } catch (error) {
      console.error('Error sharing todo:', error);
      setShareError('Error sharing todo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (e) => {
    e.preventDefault();
    if (editedText.trim().length === 0) return;
    
    onEdit(todo.id, {
      text: editedText,
      description: editedDescription,
      category: editedCategory,
      dueDate: editedDueDate,
      priority: editedPriority
    });
    
    setIsEditing(false);
  };

  const handlePermissionChange = async (userId, sharedId, newPermission) => {
    const user = sharedUsers.find(u => u.userId === userId);
    if (!user) {
      console.error('User not found in shared users list');
      return;
    }
    
    const previousPermission = user.permission;
    
    try {
      setUpdatingPermission(userId);
      
      // Update the local state immediately for better UX
      setSharedUsers(users =>
        users.map(u =>
          u.userId === userId 
            ? { ...u, permission: newPermission }
            : u
        )
      );

      // Make the API call with user's email
      await updatePermission(user.email, sharedId, newPermission);
      console.log('Permission updated successfully for user:', user.email);
      
    } catch (error) {
      console.error('Error updating permission:', error);
      // Revert the local state if the API call fails
      setSharedUsers(users =>
        users.map(u =>
          u.userId === userId 
            ? { ...u, permission: previousPermission }
            : u
        )
      );
      
      // Show error message to user
      alert('Failed to update permission. Please try again.');
    } finally {
      setUpdatingPermission(null);
    }
  };

  const handleRevokeAccess = async (userId, sharedId) => {
    try {
      await revokeAccess(userId, sharedId);
      setSharedUsers(users => users.filter(user => user.userId !== userId));
    } catch (error) {
      console.error('Error revoking access:', error);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: '#DC2626',
      medium: '#F59E0B',
      low: '#10B981',
    };
    return colors[priority] || '#6B7280';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // If editing, show expanded form
  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-lg p-6 mb-4"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
            <input
              type="text"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              rows="3"
              placeholder="Add a description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={editedCategory}
                onChange={(e) => setEditedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="personal">Personal</option>
                <option value="work">Work</option>
                <option value="shopping">Shopping</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={editedPriority}
                onChange={(e) => setEditedPriority(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={editedDueDate}
              onChange={(e) => setEditedDueDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Show Shared Users section (only visible to original owner) */}
          {todo.originalOwner === currentUserEmail && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowSharedUsers(!showSharedUsers)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black transition-colors"
              >
                <svg
                  className={`w-5 h-5 transition-transform ${showSharedUsers ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
                Show Shared Users ({sharedUsers.length})
              </button>

              <AnimatePresence>
                {showSharedUsers && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div className="max-h-48 overflow-y-auto">
                      {isLoadingUsers ? (
                        <div className="p-4 text-center text-gray-500">Loading shared users...</div>
                      ) : sharedUsers.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No shared users yet</div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {sharedUsers.map(user => (
                            <div key={user.userId} className="p-3 flex items-center justify-between bg-gray-50">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700">{user.email}</p>
                                <div className="flex items-center gap-2">
                                  <select
                                    value={user.permission}
                                    onChange={(e) => handlePermissionChange(user.userId, user.sharedId, e.target.value)}
                                    className={`mt-1 text-sm px-2 py-1 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black ${
                                      updatingPermission === user.userId ? 'opacity-50' : ''
                                    }`}
                                    data-userid={user.userId}
                                    disabled={updatingPermission === user.userId}
                                  >
                                    <option value="view">View Only</option>
                                    <option value="edit">Can Edit</option>
                                  </select>
                                  {updatingPermission === user.userId && (
                                    <span className="text-xs text-gray-500">Updating...</span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRevokeAccess(user.userId, user.sharedId)}
                                className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                                title="Revoke Access"
                                disabled={updatingPermission === user.userId}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-600 hover:text-black transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </motion.div>
    );
  }

  // Default display mode
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white p-4 rounded-lg shadow-sm border mb-3 ${
        todo.isShared ? 'border-blue-200 bg-blue-50' : 'border-gray-100'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id)}
            className={`h-4 w-4 rounded border-gray-300 focus:ring-black ${
              todo.isShared && todo.permission === 'view' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer text-black'
            }`}
            disabled={todo.isShared && todo.permission === 'view'}
          />
          <div 
            className="relative ml-3 flex-1"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <div className="flex items-center gap-2">
              <span className={`${todo.completed ? 'line-through text-gray-400' : ''}`}>
                {todo.text || 'Untitled Task'}
              </span>
              {todo.isShared && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {todo.ownerEmail === todo.originalOwner ? 
                    `Shared by ${todo.ownerEmail}` :
                    `Shared by ${todo.ownerEmail} (Originally created by ${todo.originalOwner})`
                  } ({todo.permission === 'view' ? 'View Only' : 'Can Edit'})
                </span>
              )}
            </div>
            {todo.description && (
              <p className="text-sm text-gray-600 mt-1">
                {todo.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {(!todo.isShared || todo.permission === 'edit') && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSharing(true)}
              className="p-2 text-gray-600 hover:text-black transition-colors"
              title="Share Todo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </motion.button>
          )}

          {(!todo.isShared || todo.permission === 'edit') && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-gray-600 hover:text-black transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDelete(todo.id, todo.isShared, todo.sharedId)}
            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
            title={todo.isShared ? "Remove from my list" : "Delete todo"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Share Dialog */}
      <AnimatePresence>
        {isSharing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsSharing(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">Share Todo</h3>
              <form onSubmit={handleShare}>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black mb-4"
                  disabled={isLoading}
                />
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permission Level
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="view"
                        checked={sharePermission === 'view'}
                        onChange={(e) => setSharePermission(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">View Only</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="edit"
                        checked={sharePermission === 'edit'}
                        onChange={(e) => setSharePermission(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Can Edit</span>
                    </label>
                  </div>
                </div>
                {shareError && (
                  <p className="text-red-500 text-sm mb-4">{shareError}</p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSharing(false)}
                    className="px-4 py-2 text-gray-600 hover:text-black transition-colors"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sharing...' : 'Share'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip content */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 top-full mt-2 w-64 p-4 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
          >
            {todo.description && (
              <div className="mb-2">
                <span className="text-sm font-medium text-gray-700">Description:</span>
                <p className="text-sm text-gray-600">{todo.description}</p>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-700">Category:</span>
              <span className="text-gray-600">{todo.category || 'Not set'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-700">Priority:</span>
              <span style={{ color: getPriorityColor(todo.priority) }}>
                {todo.priority || 'Not set'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-700">Due:</span>
              <span className="text-gray-600">{formatDate(todo.dueDate)}</span>
            </div>
            {todo.isShared && (
              <>
                <div className="flex items-center gap-2 text-sm mt-2">
                  <span className="font-medium text-gray-700">Shared by:</span>
                  <span className="text-gray-600">{todo.ownerEmail}</span>
                </div>
                {todo.ownerEmail !== todo.originalOwner && (
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <span className="font-medium text-gray-700">Original Creator:</span>
                    <span className="text-gray-600">{todo.originalOwner}</span>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default TodoItem;
