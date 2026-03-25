import React from 'react';

export function PremiumSurface({ title, subtitle, rightSlot, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-cyan-200/15 bg-[color:var(--portal-surface)] backdrop-blur-xl shadow-[0_18px_48px_rgba(2,8,25,0.35)] ${className}`}>
      {(title || subtitle || rightSlot) ? (
        <header className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
          <div>
            {title ? <h3 className="text-base font-semibold text-[color:var(--text-light)]">{title}</h3> : null}
            {subtitle ? <p className="text-xs text-[color:var(--portal-muted)] mt-1">{subtitle}</p> : null}
          </div>
          {rightSlot ? <div>{rightSlot}</div> : null}
        </header>
      ) : null}
      <div className="px-5 pb-5">{children}</div>
    </section>
  );
}

export function StatCard({ icon, label, value, hint, tone = 'info', trend }) {
  const toneClassMap = {
    info: 'from-cyan-500/20 to-blue-500/10 border-cyan-300/20',
    success: 'from-emerald-500/20 to-green-500/10 border-emerald-300/20',
    warning: 'from-amber-500/20 to-orange-500/10 border-amber-300/20',
    danger: 'from-rose-500/20 to-red-500/10 border-rose-300/20'
  };

  return (
    <article className={`rounded-2xl border bg-gradient-to-br p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(2,8,25,0.4)] ${toneClassMap[tone] || toneClassMap.info}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--portal-muted)]">{label}</p>
          <p className="text-3xl font-bold text-[color:var(--text-light)] mt-2">{value}</p>
          {hint ? <p className="text-xs text-[color:var(--portal-muted)] mt-2">{hint}</p> : null}
        </div>
        <span className="text-2xl" aria-hidden="true">{icon}</span>
      </div>
      {trend ? <p className="text-xs text-cyan-200 mt-3">{trend}</p> : null}
    </article>
  );
}

export function StatusChip({ tone = 'info', children }) {
  const toneClassMap = {
    info: 'border-cyan-300/35 bg-cyan-500/10 text-cyan-200',
    success: 'border-emerald-300/35 bg-emerald-500/10 text-emerald-200',
    warning: 'border-amber-300/35 bg-amber-500/10 text-amber-200',
    danger: 'border-rose-300/35 bg-rose-500/10 text-rose-200'
  };

  return <span className={`px-2.5 py-1 rounded-full border text-xs ${toneClassMap[tone] || toneClassMap.info}`}>{children}</span>;
}

export function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-white/10 border border-cyan-200/15 ${className}`} />;
}
