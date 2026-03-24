import React from 'react';

export default function PremiumPlans() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'Forever',
      badge: 'Start Here',
      features: [
        'Unlimited discover & browse',
        '10 likes per day',
        'Browse profiles anonymously',
        'Basic profile creation',
        'Message after match',
      ],
      cta: 'Get Started',
      isPremium: false,
    },
    {
      name: 'Premium+',
      price: '$9.99',
      period: 'per month',
      badge: 'Most Popular',
      highlight: true,
      features: [
        '✓ See who sent request first',
        '✓ Unlimited requests',
        '✓ Profile Boost (3x weekly visibility)',
        '✓ Advanced filters (major, year, vibe, intent)',
        '✓ Highlight profile in discovery',
        '✓ Priority in discovery and inbox ranking',
        '✓ Message before match',
      ],
      cta: 'Activate Premium+',
      isPremium: true,
    },
  ];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="section-title mb-4">Premium Features That Get You Seen</h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            Start free and unlock request-first social dating tools designed for faster, higher-quality connections.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative animate-fade-in-up opacity-0 rounded-3xl overflow-hidden transition-all duration-300`}
              style={{
                animationDelay: `${idx * 100}ms`,
                animationFillMode: 'forwards',
              }}
            >
              {/* Premium Highlight Border */}
              {plan.isPremium && (
                <div className="absolute inset-0 bg-gradient-to-r from-blushPink via-softPink to-blushPink p-0.5 rounded-3xl pointer-events-none">
                  <div className="absolute inset-0.5 bg-white rounded-3xl"></div>
                </div>
              )}

              <div
                className={`relative p-8 rounded-3xl h-full flex flex-col ${
                  plan.isPremium
                    ? 'bg-gradient-to-br from-white via-rose-50 to-fuchsia-50 border-2 border-rose-300 shadow-2xl'
                    : 'bg-white border-2 border-softPink'
                } hover:shadow-2xl hover:scale-105 transition-all duration-300`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div
                    className={`inline-flex items-center mb-4 px-3 py-1 rounded-full text-xs font-bold w-fit ${
                      plan.isPremium
                        ? 'bg-gradient-to-r from-blushPink to-softPink text-white'
                        : 'bg-softPink text-darkBrown'
                    }`}
                  >
                    {plan.badge}
                  </div>
                )}

                {/* Plan Name */}
                <h3 className="text-3xl font-bold text-darkBrown mb-2">{plan.name}</h3>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black gradient-text">{plan.price}</span>
                    <span className="text-softBrown">/{plan.period}</span>
                  </div>
                  {plan.isPremium && (
                    <p className="text-sm text-softBrown mt-2">First 7 days free. Cancel anytime.</p>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  className={`w-full mb-8 py-3 rounded-full font-bold transition-all duration-300 ${
                    plan.isPremium
                      ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 text-white shadow-[0_14px_35px_rgba(221,62,130,0.35)] hover:brightness-110'
                      : 'border-2 border-blushPink text-blushPink hover:bg-softPink hover:text-darkBrown'
                  }`}
                >
                  {plan.cta}
                </button>

                {/* Features List */}
                <div className="flex-1 space-y-3">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                        <span className={`text-lg flex-shrink-0 ${plan.isPremium ? 'text-rose-500' : 'text-softBrown'}`}>
                        {feature.includes('✓') ? '✓' : '•'}
                      </span>
                      <span className="text-sm text-darkBrown">{feature.replace('✓ ', '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Highlight */}
        <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-violet-50 rounded-2xl p-8 text-center border border-rose-200 animate-fade-in-up">
          <p className="text-darkBrown mb-2">
            <strong>Premium+ includes:</strong> Request Insights, Unlimited Requests, Boost, Advanced Filters, and Highlighted Profile.
          </p>
          <p className="text-sm text-softBrown">
            Upgrade anytime. Your profile is prioritized across discover surfaces and request visibility.
          </p>
        </div>
      </div>
    </section>
  );
}
