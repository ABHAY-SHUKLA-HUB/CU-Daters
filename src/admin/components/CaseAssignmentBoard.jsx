// ============================================================================
// CaseAssignmentBoard.jsx - Kanban-Style Case Assignment & Management
// ============================================================================
// Drag-and-drop board for assigning and tracking moderator cases across queue states

import React from 'react';
import {
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  Filter,
  Search,
  ChevronRight,
  GripVertical,
  AlertCircle
} from 'lucide-react';
import { slaCalculator } from '../utils/slaCalculator';

export function CaseAssignmentBoard({
  cases = [],
  admins = [],
  assignments = {},
  onAssign,
  onReassign,
  showSLAStatus = true
}) {
  const [selectedFilter, setSelectedFilter] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [draggedCase, setDraggedCase] = React.useState(null);
  const [groupBy, setGroupBy] = React.useState('assignee'); // 'assignee' or 'status'

  // Filter and search cases
  const filteredCases = React.useMemo(() => {
    let filtered = cases;

    // Filter by status
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(c => c.status === selectedFilter);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        (c._id && c._id.includes(q)) ||
        (c.reportedUser && c.reportedUser.toLowerCase().includes(q)) ||
        (c.reason && c.reason.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [cases, selectedFilter, searchQuery]);

  // Group cases
  const groupedCases = React.useMemo(() => {
    if (groupBy === 'assignee') {
      // Group by admin
      const groups = {};

      // Initialize empty groups for all admins
      admins.forEach(admin => {
        groups[admin._id] = { admin, cases: [] };
      });
      groups['unassigned'] = { admin: { _id: 'unassigned', name: 'Unassigned' }, cases: [] };

      // Assign cases to groups
      filteredCases.forEach(c => {
        const assignment = assignments[c._id];
        const adminId = assignment?.adminId || 'unassigned';
        if (groups[adminId]) {
          groups[adminId].cases.push(c);
        }
      });

      return Object.values(groups).filter(g => g.cases.length > 0 || g.admin._id === 'unassigned');
    } else {
      // Group by status
      const statuses = ['pending', 'in_review', 'escalated', 'resolved'];
      const groups = {};

      statuses.forEach(status => {
        groups[status] = {
          status,
          label: {
            pending: '📋 Pending Review',
            in_review: '👁️ In Review',
            escalated: '⚡ Escalated',
            resolved: '✅ Resolved'
          }[status] || status,
          cases: []
        };
      });

      filteredCases.forEach(c => {
        if (groups[c.status]) {
          groups[c.status].cases.push(c);
        }
      });

      return Object.values(groups).filter(g => g.cases.length > 0);
    }
  }, [filteredCases, groupBy, admins, assignments]);

  const handleDragStart = React.useCallback((e, caseItem) => {
    setDraggedCase(caseItem);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = React.useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = React.useCallback((e, targetAdminId) => {
    e.preventDefault();
    if (!draggedCase) return;

    if (onAssign || onReassign) {
      const handler = assignments[draggedCase._id]?.adminId ? onReassign : onAssign;
      if (handler) {
        handler(draggedCase._id, targetAdminId, 'Reassigned via drag-drop');
      }
    }

    setDraggedCase(null);
  }, [draggedCase, assignments, onAssign, onReassign]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      height: '100%',
      background: 'var(--admin-surface-base)',
      borderRadius: 'var(--admin-radius-lg)',
      padding: '16px',
      border: '1px solid var(--admin-border-subtle)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 700,
          color: 'var(--admin-text-primary)',
          margin: 0
        }}>
          Case Assignment Board
        </h2>

        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {['all', 'pending', 'in_review', 'escalated'].map(status => (
            <button
              key={status}
              onClick={() => setSelectedFilter(status)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 500,
                background: selectedFilter === status ? 'var(--admin-accent-primary)' : 'var(--admin-surface-strong)',
                color: selectedFilter === status ? 'white' : 'var(--admin-text-secondary)',
                border: selectedFilter === status ? 'none' : '1px solid var(--admin-border-subtle)',
                borderRadius: 'var(--admin-radius-md)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                textTransform: 'capitalize'
              }}
            >
              {status === 'all' ? 'All Cases' : status.replace('_', ' ')}
            </button>
          ))}

          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              background: 'var(--admin-surface-strong)',
              color: 'var(--admin-text-secondary)',
              border: '1px solid var(--admin-border-subtle)',
              borderRadius: 'var(--admin-radius-md)',
              cursor: 'pointer'
            }}
          >
            <option value='assignee'>Group by Assignee</option>
            <option value='status'>Group by Status</option>
          </select>
        </div>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: 'var(--admin-surface-strong)',
        border: '1px solid var(--admin-border-subtle)',
        borderRadius: 'var(--admin-radius-md)'
      }}>
        <Search size={16} color='var(--admin-text-secondary)' />
        <input
          type='text'
          placeholder='Search case ID, user, reason...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'var(--admin-text-primary)',
            fontSize: '13px',
            outline: 'none'
          }}
        />
      </div>

      {/* Kanban Board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(300px, 1fr))`,
        gap: '16px',
        flex: 1,
        overflowY: 'auto',
        overflowX: 'auto',
        paddingBottom: '8px'
      }}>
        {groupedCases.map(group => (
          <div
            key={group.admin?._id || group.status}
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--admin-surface-strong)',
              border: '1px solid var(--admin-border-subtle)',
              borderRadius: 'var(--admin-radius-lg)',
              overflow: 'hidden',
              minHeight: '400px'
            }}
          >
            {/* Column Header */}
            <div style={{
              padding: '12px',
              background: 'var(--admin-surface-elevated)',
              borderBottom: '1px solid var(--admin-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <div>
                <h3 style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--admin-text-primary)',
                  margin: 0
                }}>
                  {group.admin?.name || group.label}
                </h3>
                {group.admin && (
                  <p style={{
                    fontSize: '11px',
                    color: 'var(--admin-text-secondary)',
                    margin: '2px 0 0 0'
                  }}>
                    {group.admin.email}
                  </p>
                )}
              </div>

              {/* Case count badge */}
              <span style={{
                fontSize: '12px',
                fontWeight: 700,
                background: 'var(--admin-accent-primary)',
                color: 'white',
                padding: '2px 8px',
                borderRadius: 'var(--admin-radius-sm)',
                minWidth: '24px',
                textAlign: 'center'
              }}>
                {group.cases.length}
              </span>
            </div>

            {/* Droppable Area */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, group.admin?._id || group.status)}
              style={{
                flex: 1,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                overflowY: 'auto',
                background: draggedCase ? 'var(--admin-surface-base)80' : 'transparent',
                transition: 'background 150ms ease'
              }}
            >
              {group.cases.map(caseItem => {
                const slaStatus = showSLAStatus && caseItem.slaType
                  ? slaCalculator.calculateSLAStatus(caseItem.createdAt, caseItem.slaType)
                  : null;

                const slaColor = {
                  'ok': '#10b981',
                  'warning': '#f59e0b',
                  'breached': '#ef4444'
                }[slaStatus?.status] || '#3b82f6';

                return (
                  <div
                    key={caseItem._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, caseItem)}
                    style={{
                      padding: '10px',
                      background: 'var(--admin-surface-base)',
                      border: '1px solid var(--admin-border-subtle)',
                      borderRadius: 'var(--admin-radius-md)',
                      cursor: 'grab',
                      transition: 'all 150ms ease',
                      opacity: draggedCase?._id === caseItem._id ? 0.5 : 1,
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'flex-start'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-border-default)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-border-subtle)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <GripVertical size={14} color='var(--admin-text-tertiary)' style={{ flexShrink: 0, marginTop: '1px' }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Case ID */}
                      <p style={{
                        fontSize: '11px',
                        color: 'var(--admin-text-tertiary)',
                        margin: '0 0 4px 0',
                        fontFamily: 'monospace'
                      }}>
                        {caseItem._id?.slice(0, 8)}...
                      </p>

                      {/* Case Description */}
                      <h4 style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--admin-text-primary)',
                        margin: '0 0 4px 0',
                        lineHeight: 1.3
                      }}>
                        {caseItem.reason || caseItem.reportedUser || 'Case'}
                      </h4>

                      {/* SLA Badge */}
                      {slaStatus && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '10px',
                          fontWeight: 600,
                          color: slaColor,
                          marginTop: '4px'
                        }}>
                          {slaStatus.status === 'breached' && <AlertTriangle size={12} />}
                          {slaStatus.status === 'warning' && <Clock size={12} />}
                          {slaStatus.hoursRemaining > 0
                            ? `${slaStatus.hoursRemaining.toFixed(1)}h left`
                            : 'SLA breached'
                          }
                        </div>
                      )}

                      {/* Age */}
                      <p style={{
                        fontSize: '10px',
                        color: 'var(--admin-text-tertiary)',
                        margin: '4px 0 0 0'
                      }}>
                        {new Date(caseItem.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}

              {group.cases.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  color: 'var(--admin-text-tertiary)',
                  padding: '20px 0',
                  fontSize: '13px'
                }}>
                  Drop cases here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {groupedCases.length === 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '40px 20px',
          color: 'var(--admin-text-secondary)'
        }}>
          <AlertCircle size={32} opacity={0.5} />
          <p style={{ fontSize: '14px', margin: 0 }}>No cases matching filters</p>
        </div>
      )}
    </div>
  );
}

export default CaseAssignmentBoard;
