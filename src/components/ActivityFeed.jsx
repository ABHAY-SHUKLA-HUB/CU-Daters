import React from 'react';

export default function ActivityFeed({ activities, compact = false }) {
  const rootClass = compact
    ? ''
    : 'glass-panel rounded-2xl p-5 border border-white/15';

  return (
    <div className={rootClass}>
      <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
        <span className="text-xl">⚡</span>
        Activity
      </h3>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {activities && activities.length > 0 ? (
          activities.map((activity, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all cursor-pointer border border-white/10 hover:border-white/20">
              <span className="text-2xl">{activity.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{activity.name}</p>
                <p className="text-xs text-gray-400">{activity.action}</p>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">{activity.time}</span>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <p className="text-2xl mb-2">📭</p>
            <p className="text-sm text-gray-400">No activity yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
