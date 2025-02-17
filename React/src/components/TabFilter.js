import React from 'react';

function TabFilter({ activeTab, onTabChange }) {
  return (
    <div className="tab-filter">
      <button 
        className={activeTab === 'all' ? 'active' : ''} 
        onClick={() => onTabChange('all')}
      >
        All
      </button>
      <button 
        className={activeTab === 'pending' ? 'active' : ''} 
        onClick={() => onTabChange('pending')}
      >
        Pending
      </button>
      <button 
        className={activeTab === 'completed' ? 'active' : ''} 
        onClick={() => onTabChange('completed')}
      >
        Completed
      </button>
    </div>
  );
}

export default TabFilter; 