import { useState, useRef, useEffect } from 'react';

export function useSwipeGesture(onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown) {
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);

  const handleTouchStart = (e) => {
    setIsSwiping(true);
    touchStartX.current = e.changedTouches[0].screenX;
    touchStartY.current = e.changedTouches[0].screenY;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX;
    touchEndY.current = e.changedTouches[0].screenY;
    handleSwipe();
    setIsSwiping(false);
  };

  const handleSwipe = () => {
    const distanceX = touchStartX.current - touchEndX.current;
    const distanceY = touchStartY.current - touchEndY.current;
    const isHorizontal = Math.abs(distanceX) > Math.abs(distanceY);
    const minDistance = 50; // Minimum swipe distance in pixels

    if (isHorizontal && Math.abs(distanceX) > minDistance) {
      if (distanceX > 0) {
        // Swiped left
        onSwipeLeft?.();
      } else {
        // Swiped right
        onSwipeRight?.();
      }
    } else if (!isHorizontal && Math.abs(distanceY) > minDistance) {
      if (distanceY > 0) {
        // Swiped up
        onSwipeUp?.();
      } else {
        // Swiped down
        onSwipeDown?.();
      }
    }
  };

  return {
    isSwiping,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
    },
  };
}

export default useSwipeGesture;
