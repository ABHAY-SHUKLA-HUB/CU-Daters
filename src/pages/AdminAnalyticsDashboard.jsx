import React, { useEffect, useState } from 'react';

export default function AdminAnalyticsDashboard() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    // Simulate analytics data from localStorage
    const users = JSON.parse(localStorage.getItem('cudaters_users') || '[]');
    const chats = JSON.parse(localStorage.getItem('cudaters_chats') || '[]');
    const reports = JSON.parse(localStorage.getItem('cudaters_reports') || '[]');
    setStats({
      totalUsers: users.length,
      approvedUsers: users.filter(u => u.approved).length,
      suspendedUsers: users.filter(u => u.suspended).length,
      rejectedUsers: users.filter(u => u.rejected).length,
      totalChats: chats.length,
      totalReports: reports.length,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-creamyWhite via-warmCream to-softPink pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="card mb-6">
          <h1 className="text-3xl font-bold gradient-text">Analytics Dashboard</h1>
          <p className="text-softBrown mt-1">Overview of platform statistics</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="card text-center">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-softBrown text-sm">Total Users</p>
            <p className="text-2xl font-bold text-darkBrown">{stats.totalUsers}</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl mb-2">✓</div>
            <p className="text-softBrown text-sm">Approved Users</p>
            <p className="text-2xl font-bold text-green-600">{stats.approvedUsers}</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl mb-2">🚫</div>
            <p className="text-softBrown text-sm">Suspended Users</p>
            <p className="text-2xl font-bold text-red-600">{stats.suspendedUsers}</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl mb-2">❌</div>
            <p className="text-softBrown text-sm">Rejected Users</p>
            <p className="text-2xl font-bold text-gray-600">{stats.rejectedUsers}</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-softBrown text-sm">Total Chats</p>
            <p className="text-2xl font-bold text-blushPink">{stats.totalChats}</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl mb-2">🚩</div>
            <p className="text-softBrown text-sm">Total Reports</p>
            <p className="text-2xl font-bold text-orange-600">{stats.totalReports}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
