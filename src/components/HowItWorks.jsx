import React from 'react';
import { Link } from 'react-router-dom';

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      icon: '✓',
      title: 'Verify Your Identity',
      description: 'Email + Government ID + Face verification. Takes 5 minutes.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      number: 2,
      icon: '👀',
      title: 'Discover & Browse',
      description: 'Explore verified profiles near you. Stay completely anonymous while browsing.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      number: 3,
      icon: '💕',
      title: 'Like & Match',
      description: 'Mutual likes = Match! Now you can see each other and start talking.',
      color: 'from-pink-500 to-rose-500',
    },
    {
      number: 4,
      icon: '💬',
      title: 'Private Chat',
      description: 'Connect with your match in private, encrypted conversations. Build real connections.',
      color: 'from-orange-500 to-yellow-500',
    },
  ];

  return (
    <section className="py-20 md:py-24 px-4 bg-[linear-gradient(180deg,#fff_0%,#fffaf4_52%,#fff_100%)]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="section-title mb-4">How It Works</h2>
          <p className="section-subtitle max-w-3xl mx-auto">
            Join thousands of people who found their people on SeeU-Daters. The process is simple, safe, and completely anonymous until you're ready.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-5">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="relative animate-fade-in-up opacity-0"
              style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'forwards' }}
            >
              {/* Connector Line (desktop only) */}
              {idx < steps.length - 1 && (
                <div className="hidden xl:block absolute top-12 -right-2 w-12 h-0.5 bg-gradient-to-r from-rose-400 to-transparent"></div>
              )}

              {/* Step Card */}
              <div className="relative h-full bg-white rounded-3xl p-6 border border-rose-200/70 shadow-[0_14px_30px_rgba(190,24,93,0.08)] hover:border-rose-400 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(190,24,93,0.14)] hover:-translate-y-1">
                {/* Circle Number */}
                <div
                  className={`absolute -top-6 left-1/2 transform -translate-x-1/2 w-14 h-14 rounded-full bg-gradient-to-br ${step.color} text-white font-bold text-lg flex items-center justify-center shadow-lg`}
                >
                  {step.number}
                </div>

                {/* Content */}
                <div className="pt-6 text-center flex flex-col h-full">
                  <div className="text-4xl mb-4">{step.icon}</div>
                  <h3 className="text-lg font-bold text-darkBrown mb-3">{step.title}</h3>
                  <p className="text-sm text-softBrown leading-relaxed">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 animate-fade-in-up">
          <p className="text-lg text-darkBrown mb-6 font-semibold">
            Ready to find your people?
          </p>
          <Link to="/signup" className="inline-flex px-7 py-3 rounded-full font-bold text-white bg-gradient-to-r from-rose-500 to-orange-400 shadow-[0_14px_34px_rgba(244,63,94,0.28)] hover:brightness-110 transition">
            Start Verifying Now →
          </Link>
        </div>
      </div>
    </section>
  );
}

