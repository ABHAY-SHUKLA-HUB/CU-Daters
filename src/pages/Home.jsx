import React from 'react';
import { Link } from 'react-router-dom';
import PremiumHero from '../components/PremiumHero';
import PremiumFeatureCard from '../components/PremiumFeatureCard';
import HowItWorks from '../components/HowItWorks';
import ChatShowcase from '../components/ChatShowcase';
import SafetySection from '../components/SafetySection';
import PremiumPlans from '../components/PremiumPlans';
import Testimonials from '../components/Testimonials';
import FAQSection from '../components/FAQSection';
import FinalCTA from '../components/FinalCTA';
import SocialProof from '../components/SocialProof';

export default function Home() {
  return (
    <div className="bg-white">
      {/* ===== PREMIUM HERO SECTION (NEW COMPONENT) ===== */}
      <PremiumHero />

      {/* SOCIAL PROOF SECTION */}
      <SocialProof />

      {/* ===== PREMIUM FEATURE CARDS SECTION ===== */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="section-title text-4xl mb-4">Why CU Daters Stands Out</h2>
            <p className="section-subtitle max-w-3xl mx-auto text-lg">
              Built by students, for students. Six powerful features that make CU Daters the safest, most private college dating platform.
            </p>
          </div>

          {/* 6 Premium Feature Cards Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <PremiumFeatureCard
              icon="✓"
              title="Actually Verified. Actually Safe."
              subtitle="Every profile verified with college email, face ID, and real student status. Zero fake profiles—ever."
              gradient="blue"
              delay={0}
            />
            <PremiumFeatureCard
              icon="👻"
              title="Your Privacy, Your Rules"
              subtitle="Stay completely anonymous. Reveal your name, photos, and socials only when you want."
              gradient="purple"
              delay={100}
            />
            <PremiumFeatureCard
              icon="💬"
              title="Conversations Are Yours Alone"
              subtitle="Encrypted chats only between you and your match. Screenshot warning included."
              gradient="pink"
              delay={200}
            />
            <PremiumFeatureCard
              icon="🎯"
              title="Your Campus, Your People"
              subtitle="Find people in your year, major, and interests. Real connections with real students from your campus."
              gradient="orange"
              delay={300}
            />
            <PremiumFeatureCard
              icon="👑"
              title="Premium+ Unlocks More"
              subtitle="See who crushed on you. Unlimited super likes. Advanced filters. Priority chat."
              gradient="gold"
              delay={400}
            />
            <PremiumFeatureCard
              icon="📍"
              title="By Campus, For Campus"
              subtitle="Exclusive to verified students. No randoms. No catfish. Just your people."
              gradient="slate"
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <HowItWorks />

      {/* PRIVATE CHAT SHOWCASE SECTION */}
      <ChatShowcase />

      {/* SAFETY & VERIFICATION SECTION */}
      <SafetySection />

      {/* PREMIUM PLANS SECTION */}
      <PremiumPlans />

      {/* TESTIMONIALS SECTION */}
      <Testimonials />

      {/* FAQ SECTION */}
      <FAQSection />

      {/* FINAL CTA SECTION */}
      <FinalCTA />
    </div>
  );
}
