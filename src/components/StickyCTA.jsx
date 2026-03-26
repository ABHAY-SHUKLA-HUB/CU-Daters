import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky CTA after meaningful scroll depth
      setIsVisible(window.scrollY > 420);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Mobile Sticky CTA Bar */}
      <div className="fixed bottom-3 left-3 right-3 bg-gradient-to-r from-rose-500 to-orange-400 rounded-2xl
                      px-4 py-3 shadow-2xl flex justify-between items-center z-40 md:hidden border border-white/30"
           style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="pr-3">
          <p className="text-white font-bold text-sm">Ready to connect?</p>
          <p className="text-xs text-white opacity-90">Free signup • 2 mins</p>
        </div>
        <Link to="/signup">
          <button className="bg-white text-rose-500 px-5 py-2 rounded-full font-bold hover:scale-105 transition-all whitespace-nowrap">
            Get Started
          </button>
        </Link>
      </div>

      {/* Desktop Floating CTA */}
      <div className="hidden md:block fixed bottom-8 right-8 bg-gradient-to-r from-rose-500 to-orange-400 
                      text-white p-6 rounded-2xl shadow-2xl z-40 max-w-xs hover:shadow-3xl transition-all">
        <p className="font-bold mb-3 text-sm">Join CU Students</p>
        <p className="text-xs opacity-90 mb-4">Finding real connections on campus</p>
        <Link to="/signup" className="block">
          <button className="w-full bg-white text-rose-500 px-6 py-2 rounded-full font-bold hover:scale-105 transition-all">
            Start Free
          </button>
        </Link>
      </div>
    </>
  );
}
