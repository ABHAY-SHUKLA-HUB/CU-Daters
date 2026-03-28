import React from 'react';

/**
 * Razorpay Secure Badge Component
 * Displays a trust badge for payment security
 * 
 * Props:
 * - variant: 'compact' (small) | 'full' (larger with text) - default: 'compact'
 * - className: Additional CSS classes
 */
export default function RazorpayBadge({ variant = 'compact', className = '' }) {
  if (variant === 'full') {
    return (
      <div className={`rounded-2xl border border-rose-200/60 bg-gradient-to-br from-white to-rose-50/40 p-6 shadow-[0_8px_24px_rgba(190,24,93,0.08)] ${className}`}>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-fuchsia-500 flex items-center justify-center text-2xl shadow-lg shadow-rose-200">
              🔒
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-darkBrown">Payments by Razorpay</h3>
            <p className="text-sm text-softBrown mt-1">
              100% secure. Your card details are never stored on our servers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Compact variant (default)
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-rose-50 to-fuchsia-50 border border-rose-200/60 shadow-sm ${className}`}>
      <span className="text-lg">🔒</span>
      <span className="text-sm font-semibold text-darkBrown">Razorpay Secure</span>
    </div>
  );
}
