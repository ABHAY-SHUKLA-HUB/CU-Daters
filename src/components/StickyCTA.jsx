import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky CTA after scrolling past hero (500px)
      setIsVisible(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Mobile Sticky CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blushPink to-softPink 
                      px-4 py-4 shadow-2xl flex justify-between items-center z-40 md:hidden">
        <div>
          <p className="text-white font-bold text-sm">Ready to connect?</p>
          <p className="text-xs text-white opacity-90">Free signup • 2 mins</p>
        </div>
        <Link to="/signup">
          <button className="bg-white text-blushPink px-6 py-2 rounded-full font-bold hover:scale-105 transition-all">
            Get Started
          </button>
        </Link>
      </div>

      {/* Desktop Floating CTA */}
      <div className="hidden md:block fixed bottom-8 right-8 bg-gradient-to-r from-blushPink to-softPink 
                      text-white p-6 rounded-2xl shadow-2xl z-40 max-w-xs hover:shadow-3xl transition-all">
        <p className="font-bold mb-3 text-sm">Join CU Students</p>
        <p className="text-xs opacity-90 mb-4">Finding real connections on campus</p>
        <Link to="/signup" className="block">
          <button className="w-full bg-white text-blushPink px-6 py-2 rounded-full font-bold hover:scale-105 transition-all">
            Start Free
          </button>
        </Link>
      </div>
    </>
  );
}
