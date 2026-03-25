import React from 'react';

export default function Careers() {
  return (
    <div className="pt-20 pb-20">
      <section className="bg-gradient-to-br from-creamyWhite to-warmCream py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-darkBrown text-center mb-4">💼 Join Our Team</h1>
          <p className="text-lg text-softBrown text-center mb-12">
            We're hiring passionate builders who want to create the safest dating platform for college students.
          </p>

          {/* Coming Soon Banner */}
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 border-2 border-rose-200 rounded-2xl p-8 text-center mb-12">
            <p className="text-4xl mb-4">🚀</p>
            <p className="text-2xl font-bold text-rose-600">Coming Soon</p>
            <p className="text-softBrown mt-2">We're building an amazing team! Check back soon for opportunities.</p>
          </div>

          {/* Open Positions */}
          <div className="grid md:grid-cols-2 gap-8 my-12">
            <div className="card opacity-50 pointer-events-none">
              <div className="text-4xl mb-4">💻</div>
              <h3 className="text-xl font-bold text-darkBrown mb-3">Full Stack Engineer</h3>
              <p className="text-softBrown mb-4">Build features that impact college students. Work with React, Node.js, and MongoDB.</p>
              <p className="text-sm text-gray-500 font-semibold">Position Opening Soon</p>
            </div>

            <div className="card opacity-50 pointer-events-none">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-bold text-darkBrown mb-3">Product Designer</h3>
              <p className="text-softBrown mb-4">Design interfaces that users love. Create beautiful, safe, and intuitive experiences.</p>
              <p className="text-sm text-gray-500 font-semibold">Position Opening Soon</p>
            </div>

            <div className="card opacity-50 pointer-events-none">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-darkBrown mb-3">Growth Manager</h3>
              <p className="text-softBrown mb-4">Drive growth across CU campuses. Build communities and create memorable experiences.</p>
              <p className="text-sm text-gray-500 font-semibold">Position Opening Soon</p>
            </div>

            <div className="card opacity-50 pointer-events-none">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-darkBrown mb-3">Security Engineer</h3>
              <p className="text-softBrown mb-4">Protect user data and build trust. Implement encryption and security best practices.</p>
              <p className="text-sm text-gray-500 font-semibold">Position Opening Soon</p>
            </div>
          </div>

          {/* Why Join Us */}
          <div className="bg-white rounded-2xl p-8 border-2 border-softPink my-12">
            <h2 className="text-2xl font-bold text-darkBrown mb-6">Why Join CU Daters?</h2>
            <ul className="space-y-4 text-softBrown">
              <li className="flex items-start gap-3">
                <span className="text-blushPink font-bold text-2xl">✓</span>
                <span><strong className="text-darkBrown">Impact:</strong> Build a product trusted by thousands of college students.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blushPink font-bold text-2xl">✓</span>
                <span><strong className="text-darkBrown">Culture:</strong> Work with a team of passionate builders who care about privacy and safety.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blushPink font-bold text-2xl">✓</span>
                <span><strong className="text-darkBrown">Growth:</strong> Learn quickly in a fast-paced startup environment.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blushPink font-bold text-2xl">✓</span>
                <span><strong className="text-darkBrown">Flexibility:</strong> Remote-friendly, flexible hours, and a supportive team.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blushPink font-bold text-2xl">✓</span>
                <span><strong className="text-darkBrown">Competitive:</strong> Competitive salary, equity, and benefits.</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <h3 className="text-2xl font-bold text-darkBrown mb-4">Interested in Joining Us?</h3>
            <p className="text-softBrown mb-6">Send us your resume and tell us why you'd be a great fit!</p>
            <a href="mailto:careers@cudaters.tech" className="inline-block px-8 py-3 bg-gradient-to-r from-blushPink to-softPink text-white font-bold rounded-full hover:shadow-lg transition">
              Apply Now
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
