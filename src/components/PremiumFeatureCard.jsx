import React from 'react';

export default function PremiumFeatureCard({ icon, title, subtitle, gradient, delay = 0 }) {
  const gradients = {
    blue: 'from-cyan-100 to-blue-100',
    purple: 'from-purple-100 to-pink-100',
    pink: 'from-pink-100 to-rose-100',
    orange: 'from-orange-100 to-yellow-100',
    gold: 'from-amber-100 to-yellow-100',
    slate: 'from-slate-100 to-slate-200',
  };

  const borderColors = {
    blue: 'border-cyan-300',
    purple: 'border-purple-300',
    pink: 'border-pink-300',
    orange: 'border-orange-300',
    gold: 'border-amber-300',
    slate: 'border-slate-300',
  };

  const shadowColors = {
    blue: 'hover:shadow-cyan-200',
    purple: 'hover:shadow-purple-200',
    pink: 'hover:shadow-pink-200',
    orange: 'hover:shadow-orange-200',
    gold: 'hover:shadow-amber-200',
    slate: 'hover:shadow-slate-200',
  };

  return (
    <div
      className={`animate-fade-in-up opacity-0`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div
        className={`h-full p-8 rounded-3xl border-2 ${borderColors[gradient]} bg-gradient-to-br ${gradients[gradient]} backdrop-blur-sm transition-all duration-500 hover:scale-105 ${shadowColors[gradient]} cursor-pointer group`}
        style={{
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity"></div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-darkBrown mb-3 leading-tight">
          {title}
        </h3>

        {/* Subtitle */}
        <p className="text-base text-softBrown leading-relaxed mb-6">
          {subtitle}
        </p>

        {/* Gradient line indicator */}
        <div
          className={`h-1 w-12 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300`}
          style={{
            background: `linear-gradient(90deg, ${
              gradient === 'blue'
                ? '#06B6D4'
                : gradient === 'purple'
                ? '#A855F7'
                : gradient === 'pink'
                ? '#EC4899'
                : gradient === 'orange'
                ? '#F97316'
                : gradient === 'gold'
                ? '#F59E0B'
                : '#64748B'
            }, transparent)`,
          }}
        ></div>
      </div>
    </div>
  );
}
