import React from 'react';
import useSupportContactConfig from '../hooks/useSupportContactConfig';

export default function About() {
  const contactConfig = useSupportContactConfig();
  const supportEmail = contactConfig.supportEmail || 'support@seeudaters.in';
  const escalationEmail = contactConfig.escalationEmail || supportEmail;

  const team = [
    {
      title: 'Product Core',
      desc: 'Designs the matching journey end-to-end, from discovery to conversation quality.',
      emoji: '🧭'
    },
    {
      title: 'Trust and Safety',
      desc: 'Builds verification, moderation, and abuse prevention systems into every release.',
      emoji: '🛡️'
    },
    {
      title: 'Messaging Systems',
      desc: 'Owns real-time chat, delivery reliability, and private communication controls.',
      emoji: '💬'
    },
    {
      title: 'Platform Operations',
      desc: 'Maintains uptime, payment integrity, and support workflows across the product.',
      emoji: '⚙️'
    }
  ];

  const values = [
    {
      icon: '🎯',
      title: 'Intentional Matching',
      desc: 'Designed to reduce swipe fatigue and move people toward better conversations.'
    },
    {
      icon: '🔐',
      title: 'Privacy First',
      desc: 'People control what they share, when they share it, and who can access full profile details.'
    },
    {
      icon: '👥',
      title: 'Safer Community',
      desc: 'Verification, moderation tools, and reporting keep the network respectful and accountable.'
    },
    {
      icon: '📈',
      title: 'Product Discipline',
      desc: 'We ship focused improvements that make discovery, messaging, and trust systems better each month.'
    }
  ];

  return (
    <div className="pt-20 pb-20">
      <section className="bg-gradient-to-br from-creamyWhite to-warmCream py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-darkBrown mb-6">
            About <span className="gradient-text">SEEU-DATERS</span>
          </h1>
          <p className="text-xl text-softBrown max-w-3xl mx-auto leading-relaxed">
            SeeU-Daters is a trust-first social discovery platform for people who want real connection without the noise.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-3xl font-bold text-darkBrown mb-4">What We Build</h2>
            <p className="text-softBrown mb-4 leading-relaxed">
              The product combines verified identities, profile intent signals, and private chat into one clean flow: discover, match, and talk with confidence.
            </p>
            <p className="text-softBrown leading-relaxed">
              Instead of maximizing endless swipes, we focus on better interactions, safer messaging, and clearer control over visibility and profile access.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-darkBrown mb-4">Why It Matters</h2>
            <p className="text-softBrown mb-4 leading-relaxed">
              Most social and dating products optimize for volume. People still end up sorting through fake intent, weak trust signals, and low-quality conversations.
            </p>
            <p className="text-softBrown leading-relaxed">
              SeeU-Daters is built for clarity. Verified accounts, moderation workflows, and privacy controls help members spend less time filtering and more time connecting.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-warmCream">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title text-center">Our Core Values</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {values.map((value, idx) => (
              <div key={idx} className="card text-center">
                <div className="text-5xl mb-4">{value.icon}</div>
                <h3 className="text-lg font-bold text-darkBrown mb-2">{value.title}</h3>
                <p className="text-softBrown text-sm">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title text-center">The Team Behind The Product</h2>
          <p className="section-subtitle text-center">Small, focused, and intentionally low-profile.</p>

          <div className="max-w-3xl mx-auto mt-8 text-center text-softBrown space-y-4">
            <p>
              We do not publish personal identities of team members by default. That is a product decision, not an omission.
            </p>
            <p>
              The same privacy principles we build for users also shape how we operate internally: minimal exposure, strong accountability, and high execution standards.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {team.map((member, idx) => (
              <div key={idx} className="card text-center hover:shadow-2xl transition-shadow">
                <div className="text-6xl mb-4">{member.emoji}</div>
                <h3 className="text-xl font-bold text-darkBrown">{member.title}</h3>
                <p className="text-softBrown text-sm mt-2">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-creamyWhite">
        <div className="max-w-3xl mx-auto">
          <h2 className="section-title text-center">How The Product Evolved</h2>
          
          <div className="space-y-6 mt-12">
            <div className="bg-white p-6 rounded-lg border-l-4 border-blushPink">
              <h3 className="font-bold text-darkBrown mb-2">The Observation 💡</h3>
              <p className="text-softBrown">
                People wanted a cleaner way to meet, with fewer fake profiles and less performative engagement.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border-l-4 border-blushPink">
              <h3 className="font-bold text-darkBrown mb-2">The Product Challenge 🎯</h3>
              <p className="text-softBrown">
                Build trust without killing momentum. Keep onboarding strong enough for safety, but simple enough to stay usable.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border-l-4 border-blushPink">
              <h3 className="font-bold text-darkBrown mb-2">The Approach ✨</h3>
              <p className="text-softBrown">
                Verification checks, identity signals, conversation controls, and moderation systems work together as one product loop.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border-l-4 border-blushPink">
              <h3 className="font-bold text-darkBrown mb-2">Today 🚀</h3>
              <p className="text-softBrown">
                SeeU-Daters now serves a broader independent community and continues to ship with a privacy-first, product-first roadmap.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-warmCream">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title text-center">What Members Get</h2>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {[
              {
                emoji: '🌍',
                title: 'Open Community',
                points: ['Independent platform', 'Inclusive membership', 'Built for real-world connections']
              },
              {
                emoji: '🔒',
                title: 'Trust Layer',
                points: ['Verification safeguards', 'Reporting and moderation', 'Profile and conversation controls']
              },
              {
                emoji: '❤️',
                title: 'Better Outcomes',
                points: ['Higher intent matches', 'Cleaner conversations', 'Less noise, more signal']
              }
            ].map((col, idx) => (
              <div key={idx} className="card">
                <div className="text-5xl mb-4">{col.emoji}</div>
                <h3 className="text-xl font-bold text-darkBrown mb-4">{col.title}</h3>
                <ul className="text-softBrown space-y-2">
                  {col.points.map((point, pidx) => (
                    <li key={pidx} className="flex items-start gap-2">
                      <span className="text-blushPink">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-title text-center">Support and Contact</h2>
          <p className="section-subtitle text-center">Need help or want to report an issue? Our support ops team is here for you.</p>

          <div className="mt-10 grid md:grid-cols-2 gap-5">
            <div className="card">
              <p className="text-xs uppercase tracking-[0.12em] text-softBrown">Primary Support</p>
              <a href={`mailto:${supportEmail}`} className="text-lg font-bold text-blushPink hover:underline mt-2 inline-block">{supportEmail}</a>
              <p className="text-softBrown text-sm mt-3">Office Hours: {contactConfig.officeHours || 'Mon-Sat, 9:00 AM - 8:00 PM'}</p>
            </div>

            <div className="card">
              <p className="text-xs uppercase tracking-[0.12em] text-softBrown">Escalation Contact</p>
              <a href={`mailto:${escalationEmail}`} className="text-lg font-bold text-blushPink hover:underline mt-2 inline-block">{escalationEmail}</a>
              <p className="text-softBrown text-sm mt-3">Target Response SLA: {contactConfig.responseSlaHours || '24'} hours</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

