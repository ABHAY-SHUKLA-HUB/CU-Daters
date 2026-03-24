import React from 'react';

const MOTION_PRESETS = {
  request: {
    icon: '❤️',
    tone: 'from-rose-500/30 via-pink-400/25 to-fuchsia-400/20',
    label: 'Request sent',
    count: 14
  },
  accepted: {
    icon: '✨',
    tone: 'from-emerald-400/30 via-teal-400/25 to-cyan-400/20',
    label: 'Request accepted',
    count: 16
  },
  match: {
    icon: '💕',
    tone: 'from-rose-500/35 via-fuchsia-400/30 to-violet-400/25',
    label: "It's a Match",
    count: 22
  }
};

export default function EmotionalFeedbackLayer({ cue, onDone }) {
  const [particles, setParticles] = React.useState([]);

  React.useEffect(() => {
    if (!cue?.id) {
      setParticles([]);
      return;
    }

    const preset = MOTION_PRESETS[cue.type] || MOTION_PRESETS.request;
    const generated = Array.from({ length: preset.count }).map((_, idx) => ({
      id: `${cue.id}-${idx}`,
      left: 18 + Math.random() * 64,
      delay: Math.random() * 0.22,
      duration: 0.9 + Math.random() * 0.9,
      drift: (Math.random() - 0.5) * 130,
      scale: 0.7 + Math.random() * 0.9,
      rotate: -28 + Math.random() * 56,
      opacity: 0.45 + Math.random() * 0.45,
      icon: idx % 5 === 0 ? '✨' : preset.icon
    }));

    setParticles(generated);

    const timeout = window.setTimeout(() => {
      onDone?.();
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [cue?.id, cue?.type, onDone]);

  if (!cue?.id) {
    return null;
  }

  const preset = MOTION_PRESETS[cue.type] || MOTION_PRESETS.request;

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${preset.tone} opacity-70 animate-emotion-fade`} />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-full border border-white/45 bg-white/20 px-5 py-2 backdrop-blur-xl text-white text-sm md:text-base font-semibold shadow-[0_20px_60px_rgba(219,39,119,0.34)] animate-emotion-pop">
          {cue.label || preset.label}
        </div>
      </div>

      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute text-2xl md:text-3xl animate-heart-particle"
          style={{
            left: `${particle.left}%`,
            bottom: '20%',
            opacity: particle.opacity,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            transform: `translate3d(${particle.drift}px, 0, 0) scale(${particle.scale}) rotate(${particle.rotate}deg)`
          }}
        >
          {particle.icon}
        </span>
      ))}

      <div className="absolute inset-0 animate-emotion-ring" />
    </div>
  );
}
