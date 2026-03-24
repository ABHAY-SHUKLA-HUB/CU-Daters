import React, { useState, useEffect, useCallback } from 'react';

/**
 * Premium Photo Preview Modal / Lightbox
 * Features:
 * - Full-screen photo preview with smooth zoom animation
 * - Multi-photo navigation with arrows and dots
 * - Keyboard & gesture support
 * - Dark overlay with elegant close button
 */
export default function PhotoPreviewModal({
  isOpen,
  photos = [],
  captions = [],
  initialIndex = 0,
  onClose,
  userName = 'User',
}) {
  // Initialize with initialIndex when modal is opened
  const [currentIndex, setCurrentIndex] = useState(() => initialIndex);

  // Use useCallback to memoize navigation functions
  const goToNext = useCallback(() => {
    setCurrentIndex(prev => {
      if (prev < photos.length - 1) {
        return prev + 1;
      }
      return prev;
    });
  }, [photos.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => {
      if (prev > 0) {
        return prev - 1;
      }
      return prev;
    });
  }, []);

  // Reset index when modal opens to new initialIndex
  useEffect(() => {
    if (isOpen) {
      // Use requestAnimationFrame to avoid setting state during render
      const frame = requestAnimationFrame(() => {
        setCurrentIndex(initialIndex);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToNext, goToPrevious, onClose]);

  if (!isOpen || !photos || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];
  const currentCaption = captions[currentIndex] || '';
  const hasMultiplePhotos = photos.length > 1;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      {/* Main Photo Container */}
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] flex items-center justify-center px-4 md:px-0">
        {/* Photo */}
        <div className="relative w-full h-full flex items-center justify-center bg-black/40 rounded-2xl overflow-hidden animate-zoom-in">
          <img
            src={currentPhoto}
            alt={`${userName} - Photo ${currentIndex + 1}`}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Close Button - Top Right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-60 w-10 h-10 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md border border-white/30 transition-all duration-300 hover:scale-110 active:scale-95"
          title="Close (ESC)"
        >
          <span className="text-white text-2xl font-light">×</span>
        </button>

        {/* Previous Photo Button - Left */}
        {hasMultiplePhotos && currentIndex > 0 && (
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md border border-white/30 transition-all duration-300 hover:scale-110 active:scale-95 group"
            title="Previous (←)"
          >
            <span className="text-white text-2xl group-hover:translate-x-[-2px] transition-transform duration-300">←</span>
          </button>
        )}

        {/* Next Photo Button - Right */}
        {hasMultiplePhotos && currentIndex < photos.length - 1 && (
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md border border-white/30 transition-all duration-300 hover:scale-110 active:scale-95 group"
            title="Next (→)"
          >
            <span className="text-white text-2xl group-hover:translate-x-[2px] transition-transform duration-300">→</span>
          </button>
        )}

        {/* Photo Counter & Dots - Bottom */}
        {hasMultiplePhotos && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-4">
            {/* Dot Indicators */}
            <div className="flex items-center gap-2">
              {photos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 border ${
                    idx === currentIndex
                      ? 'bg-white w-6 scale-125 border-white'
                      : 'bg-white/40 hover:bg-white/70 border-white/30'
                  }`}
                  title={`Go to photo ${idx + 1}`}
                />
              ))}
            </div>

            {/* Photo Counter Text */}
            <p className="text-white/60 text-xs font-medium">
              {currentIndex + 1} / {photos.length}
            </p>
          </div>
        )}

        {currentCaption ? (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-[min(92vw,620px)]">
            <div className="rounded-2xl border border-white/30 bg-black/45 backdrop-blur-md px-4 py-2.5">
              <p className="text-white/95 text-sm text-center leading-relaxed">{currentCaption}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
