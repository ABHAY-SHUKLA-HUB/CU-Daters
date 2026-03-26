import React, { useState } from 'react';

export default function AdminActivityLog() {
  const [logs] = useState(() => {
    // Initialize state from localStorage
    try {
      return JSON.parse(localStorage.getItem('seeudaters_activity_logs') || '[]');
    } catch {
      return [];
    }
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Filter logs by search term
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    return (
      log.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-creamyWhite via-warmCream to-softPink pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="card mb-6">
          <h1 className="text-3xl font-bold gradient-text">User Activity Log</h1>
          <p className="text-softBrown mt-1">View and search user actions</p>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by user, action, or details..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-creamyWhite mb-4"
          />
        </div>

        <div className="card">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-softBrown">
              <p className="text-lg">No activity logs found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-softPink">
                  <th className="text-left py-3 px-2">User</th>
                  <th className="text-left py-3 px-2">Action</th>
                  <th className="text-left py-3 px-2">Details</th>
                  <th className="text-left py-3 px-2">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => (
                  <tr key={idx} className="border-b border-softPink hover:bg-warmCream transition">
                    <td className="py-3 px-2 font-bold text-darkBrown">{log.user}</td>
                    <td className="py-3 px-2 text-softBrown">{log.action}</td>
                    <td className="py-3 px-2 text-xs text-darkBrown">{log.details}</td>
                    <td className="py-3 px-2 text-xs text-softBrown">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

