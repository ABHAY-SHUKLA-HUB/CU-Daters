// ============================================================================
// NotificationCenter.jsx - Pending Approvals, Incidents, SLA Warnings, Alerts
// ============================================================================
// Real-time notification UI for critical admin events and pending actions

import React from 'react';
import {
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  MessageSquare,
  X,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export function NotificationCenter({
  notifications = [],
  onDismiss,
  onAction,
  onClearAll,
  pendingApprovals = {},
  slaData = {},
  incidents = []
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Generate notifications from pending approvals and SLA data
  const generatedNotifications = React.useMemo(() => {
    const items = [];

    // SLA warnings
    Object.entries(slaData).forEach(([queueName, queue]) => {
      if (queue.breached > 0) {
        items.push({
          id: `sla-${queueName}-breached`,
          type: 'sla-breach',
          priority: 'critical',
          title: `${queue.breached} SLA${queue.breached === 1 ? '' : 's'} breached in ${queueName}`,
          description: `${queue.breached} items past deadline`,
          icon: AlertTriangle,
          color: '#ef4444',
          action: { label: 'View Queue', href: `/${queueName}` }
        });
      }

      if (queue.warning > 0) {
        items.push({
          id: `sla-${queueName}-warning`,
          type: 'sla-warning',
          priority: 'high',
          title: `${queue.warning} SLA${queue.warning === 1 ? '' : 's'} warning in ${queueName}`,
          description: `${queue.warning} items at risk`,
          icon: Clock,
          color: '#f59e0b',
          action: { label: 'View Queue', href: `/${queueName}` }
        });
      }
    });

    // Incidents
    incidents.forEach(incident => {
      items.push({
        id: `incident-${incident._id}`,
        type: 'incident',
        priority: incident.severity || 'high',
        title: incident.title,
        description: `${incident.count || 1} incident${(incident.count || 1) === 1 ? '' : 's'}: ${incident.reason}`,
        icon: AlertCircle,
        color: incident.severity === 'critical' ? '#ef4444' : '#f59e0b',
        action: { label: 'View Details', href: '/reports' }
      });
    });

    // Pending approvals
    Object.entries(pendingApprovals).forEach(([type, count]) => {
      if (count > 0) {
        items.push({
          id: `pending-${type}`,
          type: 'pending-approval',
          priority: 'medium',
          title: `${count} pending ${type} approval${count === 1 ? '' : 's'}`,
          description: `Action required`,
          icon: User,
          color: '#3b82f6',
          action: { label: 'Review', href: `/${type}` }
        });
      }
    });

    return items;
  }, [slaData, incidents, pendingApprovals]);

  // Combine user notifications with generated ones
  const allNotifications = React.useMemo(() => [
    ...notifications,
    ...generatedNotifications
  ], [notifications, generatedNotifications]);

  const unreadCount = allNotifications.length;
  const criticalCount = allNotifications.filter(n => n.priority === 'critical').length;

  const handleNotificationAction = React.useCallback((notification) => {
    if (onAction) {
      onAction(notification);
    }
    setIsOpen(false);
  }, [onAction]);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          position: 'relative',
          background: 'transparent',
          border: 'none',
          color: 'var(--admin-text-primary)',
          cursor: 'pointer',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--admin-radius-md)',
          transition: 'background 150ms ease'
        }}
        onMouseEnter={(e) => e.target.style.background = 'var(--admin-surface-subtle)'}
        onMouseLeave={(e) => e.target.style.background = 'transparent'}
      >
        <Bell size={20} />

        {/* Badge */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0px',
            right: '0px',
            background: criticalCount > 0 ? '#ef4444' : '#f59e0b',
            color: 'white',
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 4px',
            borderRadius: '6px',
            minWidth: '16px',
            textAlign: 'center'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          marginTop: '8px',
          width: '420px',
          background: 'var(--admin-surface-elevated)',
          border: '1px solid var(--admin-border-default)',
          borderRadius: 'var(--admin-radius-lg)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '600px',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--admin-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--admin-surface-strong)'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--admin-text-primary)',
              margin: 0
            }}>
              Notifications {unreadCount > 0 && <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>({unreadCount})</span>}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={onClearAll}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--admin-text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Notification List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {unreadCount === 0 ? (
              <div style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: 'var(--admin-text-secondary)'
              }}>
                <Bell size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ fontSize: '14px', margin: 0 }}>No notifications</p>
              </div>
            ) : (
              allNotifications.map((notification, idx) => {
                const Icon = notification.icon || AlertCircle;
                const priorityColor = {
                  critical: '#ef4444',
                  high: '#f59e0b',
                  medium: '#3b82f6',
                  low: '#10b981'
                }[notification.priority] || '#3b82f6';

                return (
                  <div
                    key={notification.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: idx < allNotifications.length - 1 ? '1px solid var(--admin-border-subtle)' : 'none',
                      background: 'transparent',
                      transition: 'background 150ms ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--admin-surface-base)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      {/* Icon */}
                      <Icon size={16} color={priorityColor} style={{ marginTop: '2px', flexShrink: 0 }} />

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--admin-text-primary)',
                          margin: '0 0 4px 0',
                          lineHeight: 1.3
                        }}>
                          {notification.title}
                        </h4>
                        <p style={{
                          fontSize: '12px',
                          color: 'var(--admin-text-secondary)',
                          margin: 0,
                          lineHeight: 1.3
                        }}>
                          {notification.description}
                        </p>
                        {notification.action && (
                          <button
                            onClick={() => handleNotificationAction(notification)}
                            style={{
                              marginTop: '6px',
                              background: 'transparent',
                              border: 'none',
                              color: priorityColor,
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {notification.action.label}
                            <ChevronRight size={12} />
                          </button>
                        )}
                      </div>

                      {/* Dismiss */}
                      <button
                        onClick={() => onDismiss && onDismiss(notification.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--admin-text-tertiary)',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {unreadCount > 0 && (
            <div style={{
              padding: '10px 16px',
              borderTop: '1px solid var(--admin-border-subtle)',
              background: 'var(--admin-surface-base)',
              fontSize: '12px',
              color: 'var(--admin-text-secondary)',
              textAlign: 'center'
            }}>
              Updates in real-time
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
