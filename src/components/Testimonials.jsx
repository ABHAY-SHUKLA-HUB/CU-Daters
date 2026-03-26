import React from 'react';

export default function Testimonials() {
  const testimonials = [
    {
      initials: 'SK',
      name: 'Sarah K.',
      major: 'CS Major • 3rd Year',
      text: 'I was skeptical about dating apps, but CU Daters felt so much safer. The anonymous thing made me comfortable saying what I actually wanted. 10/10 would recommend!',
      rating: 5
    },
    {
      initials: 'AJ',
      name: 'Aditya J.',
      major: 'Commerce • 2nd Year',
      text: 'Matched with someone from my class that I\'d been too nervous to talk to! The anonymous chat gave us both time to figure out we actually vibe. We\'re together now 3 months.',
      rating: 5
    },
    {
      initials: 'NM',
      name: 'Neha M.',
      major: 'Engineering • 1st Year',
      text: 'Made a ton of friends on here! Didn\'t expect to, but the community is so genuine. Everyone here actually goes to CU.',
      rating: 5
    }
  ];

  return (
    <section className="py-20 md:py-24 px-4 bg-[linear-gradient(180deg,#fffaf4_0%,#ffffff_55%,#fff8fb_100%)]">
      <div className="max-w-6xl mx-auto">

        <h2 className="section-title">Students Are Loving CU Daters</h2>
        <p className="section-subtitle">Real stories from real CU students</p>

        <div className="grid md:grid-cols-3 gap-6 mt-12">

          {testimonials.map((testimonial, idx) => (
            <div 
              key={idx} 
              className="h-full rounded-3xl border border-rose-200/70 bg-white/95 p-6 shadow-[0_16px_36px_rgba(190,24,93,0.08)] hover:-translate-y-1 hover:shadow-[0_22px_44px_rgba(190,24,93,0.14)] transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-orange-400 text-white 
                                flex items-center justify-center font-bold text-sm">
                  {testimonial.initials}
                </div>
                <div>
                  <h4 className="font-bold text-darkBrown">{testimonial.name}</h4>
                  <p className="text-xs text-softBrown">{testimonial.major}</p>
                </div>
              </div>

              <p className="text-softBrown mb-5 text-sm leading-relaxed">
                "{testimonial.text}"
              </p>

              <div className="flex gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="text-yellow-400">⭐</span>
                ))}
              </div>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}
