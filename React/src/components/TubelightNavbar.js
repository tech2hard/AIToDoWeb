import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

function TubelightNavbar({ onFilterChange, currentFilter }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navItems = [
    { name: 'All', icon: Circle, filter: 'all' },
    { name: 'Pending', icon: Clock, filter: 'pending' },
    { name: 'Completed', icon: CheckCircle, filter: 'completed' }
  ];

  return (
    <div className="w-full max-w-md mx-auto">
      <nav className="flex items-center justify-center gap-3 bg-white/10 border border-gray-200 backdrop-blur-lg py-1 px-1 rounded-full shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentFilter === item.filter;
          
          return (
            <button
              key={item.name}
              onClick={() => onFilterChange(item.filter)}
              className={`
                relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors
                ${isActive ? 'text-black' : 'text-gray-600 hover:text-black'}
              `}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-gray-100 rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-black rounded-t-full">
                    <div className="absolute w-12 h-6 bg-black/20 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-black/20 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-black/20 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default TubelightNavbar; 