// ============================================================================
// UserTimeline.jsx - Chronological View of User Events, Risk, Moderation
// ============================================================================
// Timeline component showing user's complete history: devices, events, actions

import React from 'react';
import {
  Smartphone,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  Calendar,
  MapPin,
  Eye,
  MessageSquare,
  Heart,
  UserX,
  Shield,
  Zap
} from 'lucide-react';

export function UserTimeline({
  userId,
  events = [],
  devices = [],
  moderationHistory = [],
  riskTimeline = [],
  onExport,
  filterType = 'all'
}) {
  const [selectedFilter, setSelectedFilter] = React.useState(filterType);
  const [expandedEvent, setExpandedEvent] = React.useState(null);

  // Merge all timeline sources
  const allEvents = React.useMemo(() => {
    const items = [];

    // Add risk timeline events
    riskTimeline.forEach(event => {
      items.push({
        type: 'risk-event',
        timestamp: new Date(event.timestamp),
        title: event.action,
        description: event.reason || event.action,
        severity: event.severity || 'medium',
        category: event.category,
        icon: AlertTriangle,
        data: event
      });
    });

    // Add general events
    events.forEach(event => {
      items.push({
        type: 'event',
        timestamp: new Date(event.timestamp || Date.now()),
        title: event.description || event.action,
        description: event.details || '',
        severity: event.severity || 'low',
        category: event.type,
        icon: getEventIcon(event.type),
        data: event
      });
    });

    // Add moderation history
    moderationHistory.forEach(action => {
      items.push({
        type: 'moderation',
        timestamp: new Date(action.timestamp || Date.now()),
        title: `Moderation: ${action.action}`,
        description: action.reason || action.action,
        severity: action.severity || 'medium',
        category: 'moderation',
        icon: Shield,
        data: action
      });
    });

    // Add device events
    devices.forEach((device) => {
      items.push({
        type: 'device',
        timestamp: new Date(device.firstSeen || Date.now()),
        title: `Device: ${device.type || 'Unknown'} device`,
        description: `${device.os || 'Unknown OS'} • ${device.ipAddress || 'IP unknown'}${device.lastSeen ? ` • Last seen: ${new Date(device.lastSeen).toLocaleDateString()}` : ''}`,
        severity: device.flagged ? 'high' : 'low',
        category: 'device',
        icon: Smartphone,
        data: device
      });
    });

    // Sort by timestamp descending
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [riskTimeline, events, moderationHistory, devices]);

  // Filter events
  const filteredEvents = React.useMemo(() => {
    if (selectedFilter === 'all') return allEvents;
    if (selectedFilter === 'risk') return allEvents.filter(e => e.type === 'risk-event');
    if (selectedFilter === 'moderation') return allEvents.filter(e => e.type === 'moderation');
    if (selectedFilter === 'device') return allEvents.filter(e => e.type === 'device');
    if (selectedFilter === 'critical') return allEvents.filter(e => e.severity === 'critical' || e.severity === 'high');
    return allEvents;
  }, [allEvents, selectedFilter]);

  // Generate CSV export
  const handleExport = React.useCallback(() => {
    const csv = [
      ['Timestamp', 'Type', 'Title', 'Severity', 'Description'],
      ...filteredEvents.map(e => [
        e.timestamp.toISOString(),
        e.type,
        e.title,
        e.severity,
        e.description
      ])
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-${userId}-timeline-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    if (onExport) onExport();
  }, [filteredEvents, userId, onExport]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: '16px',
      background: 'var(--admin-surface-base)',
      borderRadius: 'var(--admin-radius-lg)',
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
        <h3 style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--admin-text-primary)',
          margin: 0
        }}>
          User Timeline
        </h3>

        <button
          onClick={handleExport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--admin-text-secondary)',
            background: 'var(--admin-surface-strong)',
            border: '1px solid var(--admin-border-subtle)',
            borderRadius: 'var(--admin-radius-md)',
            cursor: 'pointer',
            transition: 'all 150ms ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'var(--admin-surface-elevated)';
            e.target.style.color = 'var(--admin-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'var(--admin-surface-strong)';
            e.target.style.color = 'var(--admin-text-secondary)';
          }}
        >
          <Download size={14} />
          Export Timeline
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {['all', 'risk', 'moderation', 'device', 'critical'].map(filterOption => (
          <button
            key={filterOption}
            onClick={() => setSelectedFilter(filterOption)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              background: selectedFilter === filterOption ? 'var(--admin-accent-primary)' : 'var(--admin-surface-strong)',
              color: selectedFilter === filterOption ? 'white' : 'var(--admin-text-secondary)',
              border: selectedFilter === filterOption ? 'none' : '1px solid var(--admin-border-subtle)',
              borderRadius: 'var(--admin-radius-md)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              textTransform: 'capitalize'
            }}
          >
            <Filter size={12} style={{ display: 'inline', marginRight: '4px' }} />
            {filterOption}
          </button>
        ))}
        <span style={{
          fontSize: '12px',
          color: 'var(--admin-text-tertiary)',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center'
        }}>
          {filteredEvents.length} events
        </span>
      </div>

      {/* Timeline */}
      {filteredEvents.length === 0 ? (
        <div style={{
          padding: '32px 16px',
          textAlign: 'center',
          color: 'var(--admin-text-secondary)'
        }}>
          <Calendar size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
          <p style={{ fontSize: '14px', margin: 0 }}>No events in timeline</p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '32px' }}>
          {/* Vertical line */}
          <div style={{
            position: 'absolute',
            left: '12px',
            top: 0,
            bottom: 0,
            width: '1px',
            background: 'var(--admin-border-subtle)'
          }} />

          {/* Events */}
          {filteredEvents.map((event, idx) => {
            const Icon = event.icon;
            const severityColor = {
              critical: '#ef4444',
              high: '#f59e0b',
              medium: '#3b82f6',
              low: '#10b981'
            }[event.severity] || '#3b82f6';

            const isExpanded = expandedEvent === event.timestamp.getTime() + idx;

            return (
              <div key={`${event.timestamp.getTime()}-${idx}`} style={{ marginBottom: '16px' }}>
                {/* Timeline dot and event */}
                <button
                  onClick={() => setExpandedEvent(isExpanded ? null : event.timestamp.getTime() + idx)}
                  style={{
                    position: 'relative',
                    width: '100%',
                    padding: '12px',
                    background: isExpanded ? 'var(--admin-surface-strong)' : 'var(--admin-surface-base)',
                    border: isExpanded ? '1px solid var(--admin-border-default)' : '1px solid var(--admin-border-subtle)',
                    borderRadius: 'var(--admin-radius-md)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isExpanded) {
                      e.currentTarget.style.background = 'var(--admin-surface-strong)';
                      e.currentTarget.style.borderColor = 'var(--admin-border-default)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isExpanded) {
                      e.currentTarget.style.background = 'var(--admin-surface-base)';
                      e.currentTarget.style.borderColor = 'var(--admin-border-subtle)';
                    }
                  }}
                >
                  {/* Timeline dot */}
                  <div style={{
                    position: 'absolute',
                    left: '-28px',
                    top: '16px',
                    width: '8px',
                    height: '8px',
                    background: severityColor,
                    border: '2px solid var(--admin-surface-base)',
                    borderRadius: '50%',
                    boxShadow: `0 0 0 3px var(--admin-surface-base), 0 0 8px ${severityColor}80`
                  }} />

                  {/* Content */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}>
                    <Icon size={16} color={severityColor} style={{ marginTop: '2px', flexShrink: 0 }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}>
                        <h4 style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--admin-text-primary)',
                          margin: 0
                        }}>
                          {event.title}
                        </h4>
                        <span style={{
                          fontSize: '11px',
                          color: 'var(--admin-text-tertiary)',
                          whiteSpace: 'nowrap'
                        }}>
                          {event.timestamp.toLocaleDateString()} {event.timestamp.toLocaleTimeString()}
                        </span>
                      </div>

                      <p style={{
                        fontSize: '12px',
                        color: 'var(--admin-text-secondary)',
                        margin: '4px 0 0 0',
                        lineHeight: 1.4
                      }}>
                        {event.description}
                      </p>

                      {/* Severity badge */}
                      <span style={{
                        display: 'inline-block',
                        marginTop: '6px',
                        fontSize: '10px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        background: `${severityColor}20`,
                        color: severityColor,
                        borderRadius: 'var(--admin-radius-sm)'
                      }}>
                        {event.severity}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && event.data && (
                  <div style={{
                    marginTop: '8px',
                    padding: '12px',
                    background: 'var(--admin-surface-base)',
                    border: '1px solid var(--admin-border-subtle)',
                    borderRadius: 'var(--admin-radius-md)',
                    fontSize: '12px',
                    color: 'var(--admin-text-secondary)'
                  }}>
                    <pre style={{
                      margin: 0,
                      overflow: 'auto',
                      background: 'var(--admin-surface-strong)',
                      padding: '8px',
                      borderRadius: 'var(--admin-radius-sm)',
                      fontSize: '11px',
                      fontFamily: 'monospace'
                    }}>
                      {JSON.stringify(event.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getEventIcon(type) {
  const iconMap = {
    'view': Eye,
    'like': Heart,
    'message': MessageSquare,
    'block': UserX,
    'report': AlertTriangle,
    'fraud': AlertTriangle,
    'default': Clock
  };
  return iconMap[type] || iconMap['default'];
}

export default UserTimeline;
