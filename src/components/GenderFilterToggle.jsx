import React, { useMemo } from 'react';
import '../styles/GenderFilterToggle.css';

export const GenderFilterToggle = ({ 
  currentFilter = 'both', 
  onFilterChange = () => {}
}) => {
  // Determine default labels based on user gender
  const getFilterLabel = (filter) => {
    if (filter === 'male') return 'Boys';
    if (filter === 'female') return 'Girls';
    return 'Both';
  };

  const filters = useMemo(() => [
    { value: 'male', label: 'Boys' },
    { value: 'female', label: 'Girls' },
    { value: 'both', label: 'Both' }
  ], []);

  const handleFilterClick = (filter) => {
    if (filter !== currentFilter) {
      onFilterChange(filter);
    }
  };

  return (
    <div className="gender-filter-container">
      <div className="filter-label">Showing: {getFilterLabel(currentFilter)}</div>
      <div className="filter-toggle-group">
        {filters.map((filter) => (
          <button
            key={filter.value}
            className={`filter-pill ${currentFilter === filter.value ? 'active' : ''}`}
            onClick={() => handleFilterClick(filter.value)}
            aria-pressed={currentFilter === filter.value}
            aria-label={`Filter by ${filter.label}`}
          >
            <span className="pill-text">{filter.label}</span>
            {currentFilter === filter.value && <span className="pill-glow" />}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GenderFilterToggle;
