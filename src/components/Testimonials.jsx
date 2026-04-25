import React from 'react';

export default function Testimonials() {
  const testimonials = [
    {
      initials: 'SK',
      name: 'Sarah K.',
      major: 'CS Major • 3rd Year',
      text: 'I was skeptical about dating apps, but SeeU-Daters felt so much safer. The anonymous thing made me comfortable saying what I actually wanted. 10/10 would recommend!',
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
    <section className="py-20 px-4 bg-warmCream">
      <div className="max-w-6xl mx-auto">
        
        <h2 className="section-title">Students Are Loving SeeU-Daters</h2>
        <p className="section-subtitle">Real stories from real CU students</p>
        
        <div className="grid md:grid-cols-3 gap-8 mt-12">
          
          {testimonials.map((testimonial, idx) => (
            <div 
              key={idx} 
              className="card hover-lift"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blushPink text-white 
                                flex items-center justify-center font-bold text-sm">
                  {testimonial.initials}
                </div>
                <div>
                  <h4 className="font-bold text-darkBrown">{testimonial.name}</h4>
                  <p className="text-xs text-softBrown">{testimonial.major}</p>
                </div>
              </div>
              
              <p className="text-softBrown mb-4 text-sm leading-relaxed">
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
