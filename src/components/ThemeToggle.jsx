import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { themes, activeTheme, setTheme } = useTheme();

  const activeIndex = themes.findIndex((item) => item.id === activeTheme);
  const nextTheme = themes[(activeIndex + 1) % themes.length] || themes[0];

  return (
    <button
      onClick={() => setTheme(nextTheme?.id)}
      className="theme-toggle-btn"
      title={`Switch to ${nextTheme?.name || 'next theme'}`}
      aria-label="Toggle theme"
    >
      <span className="theme-icon">🎨</span>
      <span className="theme-label">{nextTheme?.name || 'Theme'}</span>
    </button>
  );
};

export default ThemeToggle;
