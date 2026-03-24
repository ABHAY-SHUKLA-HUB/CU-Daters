import React, { useEffect, useState } from 'react';

export default function AdminReportsModeration() {
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    // Load reports from localStorage
    const allReports = JSON.parse(localStorage.getItem('cudaters_reports') || '[]');
    setReports(allReports);
  }, []);

  // Filter reports by search term
  const filteredReports = reports.filter(report => {
    if (!searchTerm) return true;
    return (
      report.reportedUser?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.details?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Moderation actions
  const handleSuspendUser = (userId) => {
    // Simulate moderation action
    alert(`User ${userId} suspended.`);
  };

  const handleDeleteUser = (userId) => {
    // Simulate moderation action
    alert(`User ${userId} deleted.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-creamyWhite via-warmCream to-softPink pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="card mb-6">
          <h1 className="text-3xl font-bold gradient-text">Reports & Moderation</h1>
          <p className="text-softBrown mt-1">View and act on user reports</p>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by user, reason, or details..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-creamyWhite mb-4"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Reports List */}
          <div className="md:col-span-2">
            <div className="card">
              {filteredReports.length === 0 ? (
                <div className="text-center py-8 text-softBrown">
                  <p className="text-lg">No reports found</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-softPink">
                      <th className="text-left py-3 px-2">Reported User</th>
                      <th className="text-left py-3 px-2">Reason</th>
                      <th className="text-left py-3 px-2">Details</th>
                      <th className="text-left py-3 px-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map(report => (
                      <tr key={report.id} className="border-b border-softPink hover:bg-warmCream transition">
                        <td className="py-3 px-2 font-bold text-darkBrown">{report.reportedUser}</td>
                        <td className="py-3 px-2 text-softBrown">{report.reason}</td>
                        <td className="py-3 px-2 text-xs text-darkBrown">{report.details}</td>
                        <td className="py-3 px-2">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="text-blushPink hover:underline font-bold"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Report Detail Panel */}
          <div>
            <div className="card">
              {selectedReport ? (
                <div>
                  <h3 className="text-lg font-bold text-darkBrown mb-4">Report Details</h3>
                  <div className="space-y-3 mb-6">
                    <div>
                      <p className="text-xs text-softBrown">Reported User</p>
                      <p className="font-bold text-darkBrown">{selectedReport.reportedUser}</p>
                    </div>
                    <div>
                      <p className="text-xs text-softBrown">Reason</p>
                      <p className="font-bold text-darkBrown">{selectedReport.reason}</p>
                    </div>
                    <div>
                      <p className="text-xs text-softBrown">Details</p>
                      <p className="font-bold text-darkBrown text-sm">{selectedReport.details}</p>
                    </div>
                    <div>
                      <p className="text-xs text-softBrown">Timestamp</p>
                      <p className="font-bold text-darkBrown">{selectedReport.timestamp}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <button
                      onClick={() => handleSuspendUser(selectedReport.reportedUser)}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-bold transition"
                    >
                      Suspend User
                    </button>
                    <button
                      onClick={() => handleDeleteUser(selectedReport.reportedUser)}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-bold transition"
                    >
                      Delete User
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="btn-secondary w-full"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 text-softBrown">
                  <div className="text-4xl mb-2">🚩</div>
                  <p>Select a report to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
