import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'discover', icon: '🔎', label: 'Discover', path: '/dashboard?tab=discover' },
    { id: 'requests', icon: '💌', label: 'Requests', path: '/requests' },
    { id: 'connections', icon: '🤝', label: 'People', path: '/connections' },
    { id: 'chat', icon: '💬', label: 'Chat', path: '/chat' },
    { id: 'profile', icon: '👤', label: 'Profile', path: '/profile' },
  ];

  const isActive = (path) => `${location.pathname}${location.search}` === path || location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden glass-panel rounded-t-3xl border-t border-white/10 shadow-2xl z-40 backdrop-blur-xl">
      <div className="flex justify-around items-center h-20">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center w-20 h-20 gap-1 transition-all duration-300 rounded-2xl ${
              isActive(item.path)
                ? 'text-white bg-gradient-to-br from-red-500/20 to-purple-500/20 border border-white/20 scale-110'
                : 'text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/20'
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs font-bold">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
