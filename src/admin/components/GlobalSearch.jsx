// ============================================================================
// GlobalSearch.jsx - Search Across Users, Cases, Reports, Payments
// ============================================================================
// Unified search interface for finding anything in the admin system

import React from 'react';
import { Search, X, User, MessageSquare, AlertCircle, CreditCard, Clock } from 'lucide-react';

export function GlobalSearch({ isOpen, onClose, onNavigateTo, data }) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState({ users: [], cases: [], reports: [], payments: [] });
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef(null);

  // Normalize search across all data sources
  const performSearch = React.useCallback((searchQuery) => {
    if (!searchQuery.trim()) {
      setResults({ users: [], cases: [], reports: [], payments: [] });
      return;
    }

    const q = searchQuery.toLowerCase();

    // Search users
    const userResults = (data.users || [])
      .filter(user =>
        (user.email && user.email.toLowerCase().includes(q)) ||
        (user.name && user.name.toLowerCase().includes(q)) ||
        (user._id && user._id.includes(searchQuery)) ||
        (user.phone && user.phone.includes(searchQuery))
      )
      .slice(0, 5)
      .map(user => ({
        type: 'user',
        label: `${user.name || 'Unknown'} (${user.email})`,
        subtitle: `User ID: ${user._id?.slice(0, 8)}...`,
        icon: User,
        id: user._id,
        data: user
      }));

    // Search chats/cases
    const caseResults = (data.chats || [])
      .filter(chat =>
        (chat.participants && chat.participants.some(p =>
          (p.email && p.email.toLowerCase().includes(q)) ||
          (p.name && p.name.toLowerCase().includes(q))
        )) ||
        (chat._id && chat._id.includes(searchQuery)) ||
        (chat.lastMessage && chat.lastMessage.toLowerCase().includes(q))
      )
      .slice(0, 5)
      .map(chat => ({
        type: 'case',
        label: `Chat: ${chat.participants?.[0]?.name || 'Conversation'}`,
        subtitle: `Participants: ${chat.participants?.length || 0}`,
        icon: MessageSquare,
        id: chat._id,
        data: chat
      }));

    // Search reports
    const reportResults = (data.reports || [])
      .filter(report =>
        (report.reportedUser && report.reportedUser.toLowerCase().includes(q)) ||
        (report.reason && report.reason.toLowerCase().includes(q)) ||
        (report._id && report._id.includes(searchQuery)) ||
        (report.description && report.description.toLowerCase().includes(q))
      )
      .slice(0, 5)
      .map(report => ({
        type: 'report',
        label: `Report: ${report.reason || 'User Report'}`,
        subtitle: `Status: ${report.status}, ID: ${report._id?.slice(0, 8)}...`,
        icon: AlertCircle,
        id: report._id,
        data: report
      }));

    // Search payments
    const paymentResults = (data.payments || [])
      .filter(payment =>
        (payment.userEmail && payment.userEmail.toLowerCase().includes(q)) ||
        (payment.plan && payment.plan.toLowerCase().includes(q)) ||
        (payment._id && payment._id.includes(searchQuery)) ||
        (payment.transactionId && payment.transactionId.includes(searchQuery))
      )
      .slice(0, 5)
      .map(payment => ({
        type: 'payment',
        label: `${payment.plan || 'Payment'} - ${payment.userEmail || 'Unknown'}`,
        subtitle: `₹${payment.amount}, ID: ${payment._id?.slice(0, 8)}...`,
        icon: CreditCard,
        id: payment._id,
        data: payment
      }));

    setResults({
      users: userResults,
      cases: caseResults,
      reports: reportResults,
      payments: paymentResults
    });
    setSelectedIndex(0);
  }, [data]);

  // Handle search input
  const handleSearchChange = React.useCallback((value) => {
    setQuery(value);
    performSearch(value);
  }, [performSearch]);

  // Focus input when palette opens
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Get all results flat
  const flatResults = React.useMemo(() => [
    ...results.users,
    ...results.cases,
    ...results.reports,
    ...results.payments
  ], [results]);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % flatResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
      } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
        e.preventDefault();
        const result = flatResults[selectedIndex];
        onNavigateTo(result.type, result.data);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatResults, selectedIndex, onNavigateTo, onClose]);

  if (!isOpen) return null;

  const hasResults = flatResults.length > 0;
  const hasQuery = query.trim().length > 0;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '10vh',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'var(--admin-surface-elevated)',
        border: '1px solid var(--admin-border-default)',
        borderRadius: 'var(--admin-radius-lg)',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '75vh',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
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
          <Search size={20} color='var(--admin-text-secondary)' />
          <input
            ref={inputRef}
            type='text'
            placeholder='Search users, chats, reports, payments... (ESC to close)'
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--admin-text-primary)',
              fontSize: '15px',
              outline: 'none'
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--admin-text-secondary)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div style={{ overflowY: 'auto', flex: 1, maxHeight: 'calc(75vh - 60px)' }}>
          {!hasQuery ? (
            <div style={{
              padding: '40px 24px',
              textAlign: 'center'
            }}>
              <Search size={48} color='var(--admin-text-tertiary)' style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--admin-text-secondary)', fontSize: '14px' }}>
                Start typing to search
              </p>
            </div>
          ) : !hasResults ? (
            <div style={{
              padding: '40px 24px',
              textAlign: 'center'
            }}>
              <X size={48} color='var(--admin-text-tertiary)' style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--admin-text-secondary)', fontSize: '14px' }}>
                No results for "{query}"
              </p>
            </div>
          ) : (
            <>
              {results.users.length > 0 && (
                <ResultSection
                  title='Users'
                  results={results.users}
                  startIndex={0}
                  selectedIndex={selectedIndex}
                  onSelect={(result) => {
                    onNavigateTo(result.type, result.data);
                    onClose();
                  }}
                />
              )}

              {results.cases.length > 0 && (
                <ResultSection
                  title='Conversations'
                  results={results.cases}
                  startIndex={results.users.length}
                  selectedIndex={selectedIndex}
                  onSelect={(result) => {
                    onNavigateTo(result.type, result.data);
                    onClose();
                  }}
                />
              )}

              {results.reports.length > 0 && (
                <ResultSection
                  title='Reports'
                  results={results.reports}
                  startIndex={results.users.length + results.cases.length}
                  selectedIndex={selectedIndex}
                  onSelect={(result) => {
                    onNavigateTo(result.type, result.data);
                    onClose();
                  }}
                />
              )}

              {results.payments.length > 0 && (
                <ResultSection
                  title='Payments'
                  results={results.payments}
                  startIndex={results.users.length + results.cases.length + results.reports.length}
                  selectedIndex={selectedIndex}
                  onSelect={(result) => {
                    onNavigateTo(result.type, result.data);
                    onClose();
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {hasResults && (
          <div style={{
            padding: '8px 12px',
            fontSize: '11px',
            color: 'var(--admin-text-tertiary)',
            borderTop: '1px solid var(--admin-border-subtle)',
            background: 'var(--admin-surface-base)',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>↑↓ Navigate • ⏎ Open</span>
            <span>{flatResults.length} results</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultSection({ title, results, startIndex, selectedIndex, onSelect }) {
  return (
    <div>
      <div style={{
        padding: '8px 12px',
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--admin-text-tertiary)',
        fontWeight: 600,
        background: 'var(--admin-surface-base)',
        borderTop: '1px solid var(--admin-border-subtle)',
        borderBottom: '1px solid var(--admin-border-subtle)',
        position: 'sticky',
        top: 0
      }}>
        {title} • {results.length}
      </div>

      {results.map((result, idx) => {
        const globalIdx = startIndex + idx;
        const isSelected = globalIdx === selectedIndex;
        const Icon = result.icon;

        return (
          <button
            key={result.id}
            onClick={() => onSelect(result)}
            style={{
              width: '100%',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: isSelected ? 'var(--admin-surface-strong)' : 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--admin-border-subtle)',
              cursor: 'pointer',
              transition: 'background 150ms ease',
              textAlign: 'left'
            }}
          >
            <Icon size={16} color='var(--admin-text-secondary)' style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--admin-text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {result.label}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'var(--admin-text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {result.subtitle}
              </div>
            </div>
            {isSelected && (
              <span style={{
                fontSize: '11px',
                color: 'var(--admin-accent-primary)',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}>
                Open
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default GlobalSearch;
