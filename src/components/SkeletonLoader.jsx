import React from 'react';

export default function SkeletonLoader() {
  return (
    <div className="w-full h-full rounded-3xl overflow-hidden bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 animate-shimmer">
      <div className="w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}
