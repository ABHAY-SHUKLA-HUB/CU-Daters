import React from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../context/ThemeContext';

function ThemeGrid({ items, title, vip = false, activeTheme, onSelectTheme }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-sm font-semibold text-rose-900">{title}</p>
        {vip ? <span className="px-2 py-0.5 text-[10px] uppercase rounded-full border border-amber-300/60 bg-amber-100 text-amber-700">VIP</span> : null}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((theme) => {
          const active = activeTheme === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onSelectTheme(theme.id)}
              className={`text-left rounded-2xl border p-3 transition-all ${active ? 'border-rose-300 bg-rose-50 shadow-[0_12px_30px_rgba(221,62,130,0.18)]' : 'border-rose-100 bg-white hover:bg-rose-50/80'}`}
            >
              <div className="h-20 rounded-xl border border-rose-100 mb-3" style={{ background: theme.preview }} />
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-rose-900">{theme.name}</p>
                {active ? <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-300/70 bg-emerald-50 text-emerald-700">Active</span> : null}
              </div>
              <p className="text-xs text-rose-700/80 mt-1 line-clamp-2">{theme.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ThemeSettingsPanel({ open, onClose }) {
  const {
    activeTheme,
    activeScope,
    themes,
    setTheme,
    setThemeForAllScopes,
    resetTheme,
    resetThemeForAllScopes
  } = useTheme();
  const [syncBothPortals, setSyncBothPortals] = React.useState(true);

  React.useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleSelectTheme = React.useCallback((themeId) => {
    if (syncBothPortals) {
      setThemeForAllScopes(themeId);
      return;
    }
    setTheme(themeId);
  }, [setTheme, setThemeForAllScopes, syncBothPortals]);

  const handleResetTheme = React.useCallback(() => {
    if (syncBothPortals) {
      resetThemeForAllScopes();
      return;
    }
    resetTheme();
  }, [resetTheme, resetThemeForAllScopes, syncBothPortals]);

  if (!open) {
    return null;
  }

  const standardThemes = themes.filter((theme) => !theme.vip);
  const vipThemes = themes.filter((theme) => theme.vip);

  const modal = (
    <div
      className="fixed top-0 left-0 w-full h-full z-[90] bg-rose-950/25 backdrop-blur-sm flex items-center justify-center overflow-hidden p-3 sm:p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Theme settings"
    >
      <div
        className="w-[90%] max-w-5xl max-h-[90vh] rounded-3xl border border-rose-200/80 bg-[#fff9fc]/95 backdrop-blur-2xl shadow-[0_24px_90px_rgba(193,96,146,0.26)] overflow-hidden flex flex-col animate-scale-in"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-rose-200/70 flex items-start justify-between gap-3 flex-none">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-rose-500">Theme Settings</p>
            <h3 className="text-xl font-bold text-rose-900 mt-1">Customize Your Portal Experience</h3>
            <p className="text-xs text-rose-700/80 mt-1">Scope: {activeScope === 'admin' ? 'Admin Portal' : 'User Portal'} · Applies instantly</p>
          </div>
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-xl border border-rose-200 bg-white text-sm text-rose-800 hover:bg-rose-50 flex-none">Close</button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-rose-900">Apply Theme Scope</p>
              <p className="text-xs text-rose-700/80 mt-1">Enable this to keep Admin and User portals on the same theme.</p>
            </div>
            <button
              type="button"
              onClick={() => setSyncBothPortals((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition ${syncBothPortals ? 'border-emerald-300/70 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-white text-rose-800 hover:bg-rose-50'}`}
            >
              {syncBothPortals ? 'Sync Both Portals: ON' : 'Sync Both Portals: OFF'}
            </button>
          </div>

          <ThemeGrid items={standardThemes} title="Standard Themes" activeTheme={activeTheme} onSelectTheme={handleSelectTheme} />
          {vipThemes.length ? <ThemeGrid items={vipThemes} title="VIP Premium Themes" vip activeTheme={activeTheme} onSelectTheme={handleSelectTheme} /> : null}

          <div className="rounded-2xl border border-rose-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-rose-900">Current Theme: {themes.find((theme) => theme.id === activeTheme)?.name || activeTheme}</p>
              <p className="text-xs text-rose-700/80 mt-1">Saved automatically for this portal scope.</p>
            </div>
            <button
              type="button"
              onClick={handleResetTheme}
              className="px-3.5 py-2 rounded-xl border border-rose-300/70 bg-rose-50 text-rose-700 text-sm font-semibold hover:bg-rose-100"
            >
              Reset To Default
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined' || !document.body) {
    return null;
  }

  return createPortal(modal, document.body);
}
