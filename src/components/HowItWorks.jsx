import React from 'react';

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      icon: '✓',
      title: 'Verify Your Identity',
      description: 'College email + Student ID + Face verification. Takes 5 minutes.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      number: 2,
      icon: '👀',
      title: 'Discover & Browse',
      description: 'Explore verified profiles from your campus. Stay completely anonymous while browsing.',
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
    <section className="py-20 px-4 bg-gradient-to-b from-white via-creamyWhite to-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="section-title mb-4">How It Works</h2>
          <p className="section-subtitle max-w-3xl mx-auto">
            Join thousands of students who found their people on SeeU-Daters. The process is simple, safe, and completely anonymous until you're ready.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-4 gap-6 md:gap-4">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="relative animate-fade-in-up opacity-0"
              style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'forwards' }}
            >
              {/* Connector Line (desktop only) */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 -right-2 w-12 h-0.5 bg-gradient-to-r from-blushPink to-transparent"></div>
              )}

              {/* Step Card */}
              <div className="relative bg-white rounded-2xl p-6 border-2 border-softPink hover:border-blushPink transition-all duration-300 hover:shadow-lg hover:scale-105">
                {/* Circle Number */}
                <div
                  className={`absolute -top-6 left-1/2 transform -translate-x-1/2 w-14 h-14 rounded-full bg-gradient-to-br ${step.color} text-white font-bold text-lg flex items-center justify-center shadow-lg`}
                >
                  {step.number}
                </div>

                {/* Content */}
                <div className="pt-6 text-center">
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
          <button className="btn-primary">Start Verifying Now →</button>
        </div>
      </div>
    </section>
  );
}
