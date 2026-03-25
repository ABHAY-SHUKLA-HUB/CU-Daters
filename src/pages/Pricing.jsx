/**
 * PRICING PAGE - 2-Tier System (Free + Premium)
 * 
 * Simplified pricing page showing only:
 * - Free Plan (₹0/forever)
 * - Premium Plan (₹99/month)
 * 
 * This replaces the previous 4-tier system (Free, CU Crush+, Gold, Platinum)
 * Configuration is now admin-controlled via pricingConfig.js
 */

import React from 'react';
import { Link } from 'react-router-dom';
import PricingTiers from '../components/PricingTiers';
import ScrollReveal from '../components/ScrollReveal';
import LazySection from '../components/LazySection';

export default function Pricing() {
  const sectionFallback = (
    <div className="max-w-7xl mx-auto px-4 py-14">
      <div className="h-24 rounded-3xl border border-rose-200/60 bg-gradient-to-r from-rose-50 to-fuchsia-50 animate-pulse" />
    </div>
  );

  return (
    <div className="pt-20 pb-20 min-h-screen bg-[radial-gradient(circle_at_15%_10%,rgba(244,114,182,0.1),transparent_32%),radial-gradient(circle_at_88%_18%,rgba(251,191,36,0.1),transparent_28%),linear-gradient(180deg,#fff_0%,#fff8fb_50%,#fff_100%)]">
      <section className="px-4 pt-14 pb-10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="max-w-4xl" delayMs={40}>
            <p className="text-xs uppercase tracking-[0.22em] text-rose-500 font-bold">Pricing Strategy</p>
            <h1 className="mt-3 text-5xl md:text-6xl font-black text-darkBrown leading-tight">
              Simple Plans,
              <span className="block bg-gradient-to-r from-rose-500 to-fuchsia-500 bg-clip-text text-transparent">Serious Product Value</span>
            </h1>
            <p className="mt-5 text-lg text-softBrown leading-relaxed max-w-3xl">
              CU-Daters keeps pricing intentionally clear: a powerful free base for discovery and a premium tier for speed, visibility, and control.
            </p>
          </ScrollReveal>

          <ScrollReveal className="mt-8 grid sm:grid-cols-3 gap-3" delayMs={140}>
            <div className="rounded-2xl border border-rose-200/60 bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.15em] text-rose-500 font-bold">Value Principle</p>
              <p className="text-sm text-darkBrown mt-2 font-semibold">No hidden upsells, no confusing tiers.</p>
            </div>
            <div className="rounded-2xl border border-rose-200/60 bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.15em] text-rose-500 font-bold">Built For Students</p>
              <p className="text-sm text-darkBrown mt-2 font-semibold">Accessible free mode with meaningful daily usage.</p>
            </div>
            <div className="rounded-2xl border border-rose-200/60 bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.15em] text-rose-500 font-bold">Admin Controlled</p>
              <p className="text-sm text-darkBrown mt-2 font-semibold">Pricing and payment methods are config-driven.</p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <LazySection fallback={sectionFallback}>
        <ScrollReveal className="px-4" delayMs={120}>
          <div className="max-w-7xl mx-auto">
            <PricingTiers />
          </div>
        </ScrollReveal>
      </LazySection>

      <LazySection fallback={sectionFallback}>
        <section className="px-4 pt-16">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.2fr_1fr] gap-5">
            <ScrollReveal className="rounded-3xl border border-rose-200/70 bg-white p-6 md:p-7 shadow-[0_18px_50px_rgba(190,24,93,0.08)]" delayMs={100}>
              <p className="text-xs uppercase tracking-[0.2em] text-rose-500 font-bold">What Premium Unlocks</p>
              <h2 className="mt-2 text-3xl font-black text-darkBrown">Acceleration, Not Restriction</h2>
              <p className="mt-3 text-softBrown">Premium is designed to speed up meaningful outcomes, not block basic social interaction.</p>
              <div className="mt-5 grid sm:grid-cols-2 gap-3 text-sm text-darkBrown">
                <div className="rounded-xl bg-rose-50/70 border border-rose-100 p-3">Priority visibility in discovery</div>
                <div className="rounded-xl bg-rose-50/70 border border-rose-100 p-3">Extended request and engagement controls</div>
                <div className="rounded-xl bg-rose-50/70 border border-rose-100 p-3">Advanced matching and filtering options</div>
                <div className="rounded-xl bg-rose-50/70 border border-rose-100 p-3">Faster path from intent to conversation</div>
              </div>
            </ScrollReveal>

            <ScrollReveal className="rounded-3xl border border-rose-200/70 bg-gradient-to-br from-rose-50 via-white to-fuchsia-50 p-6 md:p-7" delayMs={160}>
              <p className="text-xs uppercase tracking-[0.2em] text-rose-500 font-bold">Need Help?</p>
              <h3 className="mt-2 text-2xl font-black text-darkBrown">Pick The Right Plan In 60 Seconds</h3>
              <p className="mt-3 text-softBrown text-sm">Our support team can help you choose based on your usage style and goals.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/contact" className="px-4 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white text-sm font-semibold hover:brightness-110 transition">Talk To Support</Link>
                <Link to="/signup" className="px-4 py-2.5 rounded-full border-2 border-rose-300 text-rose-600 text-sm font-semibold hover:bg-rose-50 transition">Start Free</Link>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </LazySection>
    </div>
  );
}
