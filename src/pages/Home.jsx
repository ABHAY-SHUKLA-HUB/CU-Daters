import React from 'react';
import { Link } from 'react-router-dom';
import ScrollReveal from '../components/ScrollReveal';
import LazySection from '../components/LazySection';
import PremiumHero from '../components/PremiumHero';
import PremiumFeatureCard from '../components/PremiumFeatureCard';
import HowItWorks from '../components/HowItWorks';
import ChatShowcase from '../components/ChatShowcase';
import SafetySection from '../components/SafetySection';
import Testimonials from '../components/Testimonials';
import FAQSection from '../components/FAQSection';
import FinalCTA from '../components/FinalCTA';
import SocialProof from '../components/SocialProof';

export default function Home() {
  const sectionFallback = (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="h-28 rounded-3xl border border-rose-200/60 bg-gradient-to-r from-rose-50 to-fuchsia-50 animate-pulse" />
    </div>
  );

  const startupPillars = [
    {
      title: 'Trust As Infrastructure',
      body: 'Verified identity, moderation workflows, and transparent controls are built into every flow instead of bolted on later.',
      icon: '🛡️'
    },
    {
      title: 'Context-Rich Matching',
      body: 'People discover each other through context that matters in real life: interests, goals, values, and social intent.',
      icon: '🎯'
    },
    {
      title: 'Conversation First Product',
      body: 'The product is optimized for meaningful conversations, not vanity swipes, with private chat and social safety signals.',
      icon: '💬'
    }
  ];

  const productLoop = [
    {
      step: '01',
      title: 'Verified Onboarding',
      desc: 'Email + identity checks ensure every profile starts with trust.'
    },
    {
      step: '02',
      title: 'Smart Discovery',
      desc: 'Personalized recommendations surface compatible people from your network.'
    },
    {
      step: '03',
      title: 'Mutual Intent',
      desc: 'Connection requests and matching flow keep interaction consensual and signal-driven.'
    },
    {
      step: '04',
      title: 'Private Conversation',
      desc: 'Encrypted chat experience with controls for blocking, reporting, and escalation.'
    }
  ];

  return (
    <div className="bg-[radial-gradient(circle_at_14%_-6%,rgba(244,114,182,0.1),transparent_30%),radial-gradient(circle_at_88%_8%,rgba(251,191,36,0.12),transparent_30%),linear-gradient(180deg,#ffffff_0%,#fffafc_52%,#ffffff_100%)]">
      <PremiumHero />

      <SocialProof />

      <section className="py-24 px-4 bg-[radial-gradient(circle_at_8%_15%,rgba(244,114,182,0.1),transparent_34%),radial-gradient(circle_at_92%_20%,rgba(251,191,36,0.1),transparent_30%),linear-gradient(180deg,#fff_0%,#fff7fb_52%,#fff_100%)]">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="max-w-3xl" delayMs={40}>
            <p className="text-xs uppercase tracking-[0.2em] text-rose-500 font-bold">Product Narrative</p>
            <h2 className="mt-3 text-4xl md:text-5xl font-black text-darkBrown leading-tight">
              Built Like A Real Startup,
              <span className="block bg-gradient-to-r from-rose-500 to-fuchsia-500 bg-clip-text text-transparent">Focused On Real Outcomes</span>
            </h2>
            <p className="mt-4 text-base md:text-lg text-softBrown leading-relaxed">
              SeeU-Daters is designed as a trust-first social product for students: clearer intent, safer conversations, better compatibility, and a stronger network loop that grows with every verified member.
            </p>
          </ScrollReveal>

          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {startupPillars.map((pillar, index) => (
              <ScrollReveal
                key={pillar.title}
                delayMs={120 + index * 90}
                className="rounded-3xl border border-rose-200/70 bg-white/95 backdrop-blur-xl p-6 shadow-[0_18px_52px_rgba(190,24,93,0.08)] hover:-translate-y-1 hover:shadow-[0_26px_66px_rgba(190,24,93,0.16)] transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-fuchsia-500 text-white flex items-center justify-center text-xl shadow-lg shadow-rose-200 mb-4">
                  {pillar.icon}
                </div>
                <h3 className="text-xl font-extrabold text-darkBrown mb-2">{pillar.title}</h3>
                <p className="text-softBrown leading-relaxed text-sm">{pillar.body}</p>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal className="mt-10 grid sm:grid-cols-4 gap-3" delayMs={220}>
            <div className="rounded-2xl border border-rose-200/60 bg-white px-4 py-4 text-center shadow-[0_8px_22px_rgba(190,24,93,0.08)]">
              <p className="text-2xl font-black bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent">50K+</p>
              <p className="text-xs uppercase tracking-wide text-softBrown">Verified Members</p>
            </div>
            <div className="rounded-2xl border border-rose-200/60 bg-white px-4 py-4 text-center shadow-[0_8px_22px_rgba(190,24,93,0.08)]">
              <p className="text-2xl font-black bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent">200K+</p>
              <p className="text-xs uppercase tracking-wide text-softBrown">Matches</p>
            </div>
            <div className="rounded-2xl border border-rose-200/60 bg-white px-4 py-4 text-center shadow-[0_8px_22px_rgba(190,24,93,0.08)]">
              <p className="text-2xl font-black bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent">4.9★</p>
              <p className="text-xs uppercase tracking-wide text-softBrown">User Rating</p>
            </div>
            <div className="rounded-2xl border border-rose-200/60 bg-white px-4 py-4 text-center shadow-[0_8px_22px_rgba(190,24,93,0.08)]">
              <p className="text-2xl font-black bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent">24h</p>
              <p className="text-xs uppercase tracking-wide text-softBrown">Safety Review SLA</p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 items-start">
            <ScrollReveal delayMs={40}>
              <p className="text-xs uppercase tracking-[0.2em] text-rose-500 font-bold">Growth Engine</p>
              <h3 className="mt-3 text-4xl font-black text-darkBrown leading-tight">A Clear Product Loop That Compounds</h3>
              <p className="mt-4 text-softBrown leading-relaxed">
                Every stage strengthens quality: verified onboarding reduces noise, smarter discovery improves intent, and private chat drives retention.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/features" className="px-5 py-3 rounded-full bg-gradient-to-r from-rose-500 to-orange-400 text-white font-semibold shadow-[0_14px_32px_rgba(244,63,94,0.28)] hover:brightness-110 transition">Explore Product</Link>
                <Link to="/signup" className="px-5 py-3 rounded-full border-2 border-rose-300 text-rose-600 font-semibold hover:bg-rose-50 transition">Join Free</Link>
              </div>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 gap-4">
              {productLoop.map((item, index) => (
                <ScrollReveal key={item.step} delayMs={120 + index * 70} className="rounded-2xl border border-rose-200/60 bg-gradient-to-b from-white to-rose-50/40 p-5 shadow-[0_10px_26px_rgba(190,24,93,0.08)] hover:shadow-[0_18px_32px_rgba(190,24,93,0.14)] transition-shadow">
                  <p className="text-xs font-black tracking-[0.2em] text-rose-500">{item.step}</p>
                  <h4 className="mt-2 text-lg font-extrabold text-darkBrown">{item.title}</h4>
                  <p className="mt-2 text-sm text-softBrown leading-relaxed">{item.desc}</p>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <LazySection fallback={sectionFallback}>
        <React.Suspense fallback={sectionFallback}>
          <HowItWorks />
        </React.Suspense>
      </LazySection>

      <LazySection fallback={sectionFallback}>
        <React.Suspense fallback={sectionFallback}>
          <ChatShowcase />
        </React.Suspense>
      </LazySection>

      <LazySection fallback={sectionFallback}>
        <React.Suspense fallback={sectionFallback}>
          <SafetySection />
        </React.Suspense>
      </LazySection>

      <LazySection fallback={sectionFallback}>
        <React.Suspense fallback={sectionFallback}>
          <Testimonials />
        </React.Suspense>
      </LazySection>

      <LazySection fallback={sectionFallback}>
        <React.Suspense fallback={sectionFallback}>
          <FAQSection />
        </React.Suspense>
      </LazySection>

      <LazySection fallback={sectionFallback}>
        <React.Suspense fallback={sectionFallback}>
          <FinalCTA />
        </React.Suspense>
      </LazySection>
    </div>
  );
}

