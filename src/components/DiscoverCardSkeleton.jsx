import React from 'react';
import '../styles/SkeletonLoader.css';

/**
 * Premium skeleton loader for discover profile card
 * Creates smooth, premium-feeling loading states
 */
export const DiscoverCardSkeleton = () => {
  return (
    <div className="skeleton-card discover-card-skeleton">
      {/* Hero Image Section */}
      <div className="skeleton-image-wrapper">
        <div className="skeleton-image-placeholder">
          <div className="skeleton-shimmer" />
        </div>
        <div className="skeleton-gradient-overlay" />
      </div>

      {/* Profile Info Section */}
      <div className="skeleton-content">
        {/* Name and Age */}
        <div className="skeleton-line skeleton-title" />
        
        {/* College */}
        <div className="skeleton-line skeleton-subtitle" style={{ marginTop: '8px' }} />

        {/* About/Bio */}
        <div className="skeleton-lines-group" style={{ marginTop: '16px' }}>
          <div className="skeleton-line" />
          <div className="skeleton-line" />
        </div>

        {/* Interests/Tags */}
        <div className="skeleton-tags-group" style={{ marginTop: '16px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-tag" />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="skeleton-buttons-group" style={{ marginTop: '16px' }}>
          <div className="skeleton-button" />
          <div className="skeleton-button" />
          <div className="skeleton-button" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for mini profile card in sidebar
 */
export const MiniProfileSkeleton = () => {
  return (
    <div className="skeleton-mini-card">
      <div className="skeleton-mini-image" />
      <div className="skeleton-mini-info">
        <div className="skeleton-line skeleton-mini-title" />
        <div className="skeleton-line skeleton-mini-subtitle" style={{ marginTop: '6px' }} />
      </div>
    </div>
  );
};

/**
 * Skeleton for filter header
 */
export const FilterHeaderSkeleton = () => {
  return (
    <div className="skeleton-filter-header">
      <div className="skeleton-line skeleton-filter-label" />
      <div className="skeleton-filter-pills">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-pill" />
        ))}
      </div>
    </div>
  );
};

/**
 * Image loading placeholder with progressive fallback
 */
export const ImageLoadingState = ({ isLoading, fallbackColor = '#f0f0f0' }) => {
  if (!isLoading) return null;

  return (
    <div 
      className="image-loading-placeholder"
      style={{ backgroundColor: fallbackColor }}
    >
      <div className="image-loading-shimmer" />
    </div>
  );
};

export default DiscoverCardSkeleton;
