import React, { useState, useRef } from 'react';

/**
 * Enhanced Button Component with Premium Animations
 * Features:
 * - Click ripple effect
 * - Scale animation
 * - Glow feedback
 * - Visual haptic feedback (scale)
 */
export default function EnhancedActionButton({
  onClick,
  icon,
  title,
  variant = 'like', // 'like', 'pass', 'super-like'
  size = 'medium', // 'small', 'medium', 'large'
  disabled = false,
  className = '',
}) {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState([]);
  const buttonRef = useRef(null);

  const sizeClasses = {
    small: 'w-12 h-12 text-lg',
    medium: 'w-16 h-16 text-2xl',
    large: 'w-20 h-20 text-3xl',
  };

  const variantClasses = {
    like: 'btn-action-like animate-pulse-glow',
    pass: 'btn-action-pass',
    'super-like': 'btn-action-super animate-pulse-glow',
  };

  const handleMouseDown = (e) => {
    if (disabled) return;
    
    setIsPressed(true);
    
    // Create ripple effect
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newRipple = {
        id: Date.now(),
        x,
        y,
      };
      setRipples([newRipple]);
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples([]);
      }, 600);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleClick = (e) => {
    if (disabled) return;
    
    // Visual feedback
    if (buttonRef.current) {
      buttonRef.current.style.transform = 'scale(0.92)';
      setTimeout(() => {
        if (buttonRef.current) {
          buttonRef.current.style.transform = 'scale(1)';
        }
      }, 150);
    }

    // Add haptic feedback on mobile
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }

    onClick?.(e);
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      disabled={disabled}
      title={title}
      className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full relative overflow-hidden transition-all duration-200 ${
        isPressed ? 'scale-95' : 'scale-100'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {/* Ripple Effects */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ping"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: '20px',
            height: '20px',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Button Content */}
      <span className="relative z-10 block">{icon}</span>
    </button>
  );
}
