// ============================================================================
// CommandPalette.jsx - Command Palette (Cmd/Ctrl + K)
// ============================================================================
// Power-user feature for navigating admin system without mouse
// Inspired by Linear, VS Code, Figma

import React from 'react';
import { Search, ChevronRight } from 'lucide-react';

const COMMANDS = [
  // Navigation
  { id: 'nav-overview', label: 'Go to Overview', section: 'Navigation', shortcut: '1', action: (fn) => fn('overview') },
  { id: 'nav-reg-approvals', label: 'Go to Registration Approvals', section: 'Navigation', shortcut: '2', action: (fn) => fn('registration_approvals') },
  { id: 'nav-profile-approvals', label: 'Go to Profile Approvals', section: 'Navigation', shortcut: '3', action: (fn) => fn('approvals') },
  { id: 'nav-users', label: 'Go to User Directory', section: 'Navigation', shortcut: '4', action: (fn) => fn('users') },
  { id: 'nav-chats', label: 'Go to Conversation Safety', section: 'Navigation', shortcut: '5', action: (fn) => fn('chat_monitoring') },
  { id: 'nav-reports', label: 'Go to Reports Queue', section: 'Navigation', shortcut: '6', action: (fn) => fn('reports') },
  { id: 'nav-moderation', label: 'Go to Content Moderation', section: 'Navigation', shortcut: '7', action: (fn) => fn('moderation') },
  { id: 'nav-payments', label: 'Go to Payment Reviews', section: 'Navigation', shortcut: '8', action: (fn) => fn('payments') },
  { id: 'nav-support', label: 'Go to Support Desk', section: 'Navigation', shortcut: '9', action: (fn) => fn('support') },
  { id: 'nav-analytics', label: 'Go to Analytics', section: 'Navigation', shortcut: '0', action: (fn) => fn('analytics') },

  // Actions (for registration approvals section)
  { id: 'action-approve', label: 'Approve Registration', section: 'Actions', key: 'a', action: (fn) => fn('quick-approve') },
  { id: 'action-reject', label: 'Reject Registration', section: 'Actions', key: 'r', action: (fn) => fn('quick-reject') },
  { id: 'action-review', label: 'Request More Info', section: 'Actions', key: 'i', action: (fn) => fn('quick-info') },

  // Filtering
  { id: 'filter-active', label: 'Filter: Active Users', section: 'Filters', action: (fn) => fn('filter-active') },
  { id: 'filter-banned', label: 'Filter: Banned Users', section: 'Filters', action: (fn) => fn('filter-banned') },
  { id: 'filter-high-risk', label: 'Filter: High Risk Users', section: 'Filters', action: (fn) => fn('filter-high-risk') },
  { id: 'filter-unverified', label: 'Filter: Unverified Users', section: 'Filters', action: (fn) => fn('filter-unverified') },

  // Bulk operations
  { id: 'bulk-approve', label: 'Bulk Approve Selected', section: 'Bulk Actions', key: 'shift+a', action: (fn) => fn('bulk-approve') },
  { id: 'bulk-reject', label: 'Bulk Reject Selected', section: 'Bulk Actions', key: 'shift+r', action: (fn) => fn('bulk-reject') },
  { id: 'bulk-ban', label: 'Bulk Ban Selected', section: 'Bulk Actions', action: (fn) => fn('bulk-ban') },

  // Tools
  { id: 'tool-export', label: 'Export Current Section', section: 'Tools', key: 'shift+e', action: (fn) => fn('export') },
  { id: 'tool-refresh', label: 'Refresh Data', section: 'Tools', key: 'shift+r', action: (fn) => fn('refresh') },
  { id: 'tool-search', label: 'Global Search', section: 'Tools', key: '/', action: (fn) => fn('global-search') },

  // Settings
  { id: 'settings', label: 'Go to Platform Settings', section: 'Settings', action: (fn) => fn('settings') },
  { id: 'activity', label: 'Go to Audit Logs', section: 'Settings', action: (fn) => fn('activity') },
];

export function CommandPalette({ isOpen, onClose, onCommand, _currentSection }) {
  const [search, setSearch] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef(null);

  // Filter commands based on search
  const filteredCommands = React.useMemo(() => {
    if (!search.trim()) {
      // Group by section if no search
      const grouped = {};
      COMMANDS.forEach(cmd => {
        if (!grouped[cmd.section]) grouped[cmd.section] = [];
        grouped[cmd.section].push(cmd);
      });
      return grouped;
    }

    // Search across all fields
    const query = search.toLowerCase();
    return COMMANDS.filter(cmd => 
      cmd.label.toLowerCase().includes(query) ||
      cmd.section.toLowerCase().includes(query) ||
      (cmd.shortcut && cmd.shortcut.toLowerCase().includes(query))
    );
  }, [search]);

  const isGrouped = !search.trim();
  const flatCommands = isGrouped
    ? Object.values(filteredCommands).flat()
    : filteredCommands;

  // Focus input when palette opens
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const executeCommand = React.useCallback((command) => {
    command.action(onCommand);
    setSearch('');
    setSelectedIndex(0);
    onClose();
  }, [onCommand, onClose]);

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback((e) => {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % flatCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + flatCommands.length) % flatCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatCommands[selectedIndex]) {
        executeCommand(flatCommands[selectedIndex]);
      }
    }
  }, [isOpen, flatCommands, selectedIndex, onClose, executeCommand]);

  // Listen for Cmd/Ctrl + K to open palette
  React.useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Opening is handled by parent component
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '20vh',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      {/* Palette Container */}
      <div style={{
        background: 'var(--admin-surface-elevated)',
        border: '1px solid var(--admin-border-default)',
        borderRadius: 'var(--admin-radius-lg)',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '70vh',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fade-in 200ms ease'
      }}>
        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          borderBottom: '1px solid var(--admin-border-subtle)',
          background: 'var(--admin-surface-strong)'
        }}>
          <Search size={18} color='var(--admin-text-secondary)' />
          <input
            ref={inputRef}
            type='text'
            placeholder='Type command or search... (press ESC to close)'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--admin-text-primary)',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <span style={{
            fontSize: '11px',
            color: 'var(--admin-text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            ESC
          </span>
        </div>

        {/* Commands List */}
        <div style={{
          overflowY: 'auto',
          flex: 1,
          maxHeight: 'calc(70vh - 60px)'
        }}>
          {isGrouped ? (
            // Grouped view
            Object.entries(filteredCommands).map(([section, commands]) => (
              <div key={section}>
                <div style={{
                  padding: '8px 12px',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--admin-text-tertiary)',
                  fontWeight: 600,
                  background: 'var(--admin-surface-base)',
                  borderTop: '1px solid var(--admin-border-subtle)',
                  position: 'sticky',
                  top: 0
                }}>
                  {section}
                </div>
                {commands.map((cmd) => {
                  const isSelected = flatCommands.indexOf(cmd) === selectedIndex;
                  return (
                    <CommandItem
                      key={cmd.id}
                      command={cmd}
                      isSelected={isSelected}
                      onClick={() => {
                        setSelectedIndex(flatCommands.indexOf(cmd));
                        executeCommand(cmd);
                      }}
                    />
                  );
                })}
              </div>
            ))
          ) : (
            // Flat list (search results)
            flatCommands.map((cmd, idx) => (
              <CommandItem
                key={cmd.id}
                command={cmd}
                isSelected={idx === selectedIndex}
                onClick={() => {
                  setSelectedIndex(idx);
                  executeCommand(cmd);
                }}
              />
            ))
          )}
        </div>

        {/* Footer with hints */}
        <div style={{
          padding: '8px 12px',
          fontSize: '11px',
          color: 'var(--admin-text-tertiary)',
          borderTop: '1px solid var(--admin-border-subtle)',
          background: 'var(--admin-surface-base)',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>↑↓ Navigate • ⏎ Execute</span>
          <span>{flatCommands.length} commands</span>
        </div>
      </div>
    </div>
  );
}

function CommandItem({ command, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: isSelected ? 'var(--admin-surface-strong)' : 'transparent',
        border: 'none',
        borderBottom: '1px solid var(--admin-border-subtle)',
        color: 'var(--admin-text-primary)',
        cursor: 'pointer',
        transition: 'background 150ms ease',
        textAlign: 'left',
        fontSize: '14px'
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {command.label}
      </span>
      <span style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        color: 'var(--admin-text-tertiary)'
      }}>
        {command.shortcut && (
          <span style={{
            padding: '2px 6px',
            background: 'var(--admin-surface-elevated)',
            borderRadius: '4px',
            border: '1px solid var(--admin-border-subtle)',
            fontFamily: 'monospace',
            fontSize: '10px'
          }}>
            {command.shortcut}
          </span>
        )}
        <ChevronRight size={14} />
      </span>
    </button>
  );
}

export default CommandPalette;
