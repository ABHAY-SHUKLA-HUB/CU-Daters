import React from 'react';

export default function About() {
  const team = [
    { name: 'Aakash', role: 'Founder & CEO', emoji: '👨‍💼' },
    { name: 'Priya', role: 'CTO', emoji: '👩‍💻' },
    { name: 'Rahul', role: 'Head of Marketing', emoji: '📱' },
    { name: 'Neha', role: 'Safety & Compliance', emoji: '🛡️' },
  ];

  const values = [
    {
      icon: '🎯',
      title: 'Real Connections',
      desc: 'We believe in genuine relationships. Verification ensures authenticity.'
    },
    {
      icon: '🔐',
      title: 'Privacy First',
      desc: 'Your data is yours. We never monitor chats or share personal info.'
    },
    {
      icon: '👥',
      title: 'Community Safe',
      desc: 'Strict moderation and user reporting keeps our community respectful.'
    },
    {
      icon: '💡',
      title: 'Innovation',
      desc: 'Gradual reveals and anonymous chat is our unique take on dating.'
    },
  ];

  return (
    <div className="pt-20 pb-20">
      {/* Hero */}
      <section className="bg-gradient-to-br from-creamyWhite to-warmCream py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-darkBrown mb-6">
            About <span className="gradient-text">CU DATERS</span>
          </h1>
          <p className="text-xl text-softBrown max-w-2xl mx-auto">
            We're a student-driven dating app built for Chandigarh University students. By students, for students. Made with ❤️
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold text-darkBrown mb-4">Our Mission</h2>
            <p className="text-softBrown mb-4 leading-relaxed">
              To create a safe, verified, and fun dating platform where CU students can find meaningful connections without compromising privacy or safety.
            </p>
            <p className="text-softBrown leading-relaxed">
              We believe everyone deserves to explore connections with genuine people. CU DATERS makes that possible through strict verification and innovative anonymous chat features.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-darkBrown mb-4">Our Vision</h2>
            <p className="text-softBrown mb-4 leading-relaxed">
              To become the go-to dating platform for college students across India, starting with the top 30 colleges. A place where authenticity, privacy, and genuine connections matter.
            </p>
            <p className="text-softBrown leading-relaxed">
              We're not just building an app - we're building a community where students can be themselves, connect safely, and potentially find their person.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
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

      {/* Team */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title text-center">Meet the Team</h2>
          <p className="section-subtitle text-center">Built by CU students, for CU students</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {team.map((member, idx) => (
              <div key={idx} className="card text-center hover:shadow-2xl transition-shadow">
                <div className="text-6xl mb-4">{member.emoji}</div>
                <h3 className="text-xl font-bold text-darkBrown">{member.name}</h3>
                <p className="text-softBrown text-sm mt-2">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 px-4 bg-creamyWhite">
        <div className="max-w-3xl mx-auto">
          <h2 className="section-title text-center">How It Started</h2>
          
          <div className="space-y-6 mt-12">
            <div className="bg-white p-6 rounded-lg border-l-4 border-blushPink">
              <h3 className="font-bold text-darkBrown mb-2">The Idea 💡</h3>
              <p className="text-softBrown">
                In late 2025, our founder Aakash noticed that CU students didn't have a dating app made specifically for them. Other apps were flooded with fake profiles. We needed something different - verified, safe, and fun.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border-l-4 border-blushPink">
              <h3 className="font-bold text-darkBrown mb-2">The Challenge 🎯</h3>
              <p className="text-softBrown">
                How do we make online dating safe? How do we prevent fake profiles? How do we let people connect anonymously at first but gradually build trust? These questions drove our product development.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border-l-4 border-blushPink">
              <h3 className="font-bold text-darkBrown mb-2">The Solution ✨</h3>
              <p className="text-softBrown">
                Face detection + Student ID verification + Admin approval = 100% real CU students. Anonymous chat with gradual reveals = Trust building without initial pressure. Privacy-first = Users control their data.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border-l-4 border-blushPink">
              <h3 className="font-bold text-darkBrown mb-2">Today 🚀</h3>
              <p className="text-softBrown">
                5000+ verified users, 10000+ matches made, and growing daily. After launch at CU, we're expanding to top 30 colleges by 2026. The journey just started!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-4 bg-warmCream">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title text-center">Why CU Students Choose Us</h2>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {[
              { emoji: '🎓', title: 'For Students', points: ['Built by CU students', 'Understands college life', 'CU-specific features'] },
              { emoji: '🔒', title: 'Safety Matters', points: ['Verified users only', 'Strict verification', 'No fake profiles'] },
              { emoji: '❤️', title: 'Real Connections', points: ['Meaningful matches', 'Gradual reveals', 'Genuine people'] },
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
    </div>
  );
}
