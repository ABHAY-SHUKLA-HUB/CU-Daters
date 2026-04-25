import React from 'react';

export default function SafetySection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="section-title mb-4">The Safest College Dating Platform</h2>
          <p className="section-subtitle max-w-3xl mx-auto">
            SeeU-Daters uses advanced verification and safety measures to ensure you're always connecting with real, verified college students.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-12 items-start mb-16">
          {/* Left: Verification Process */}
          <div className="animate-fade-in-left space-y-6">
            <h3 className="text-2xl font-bold text-darkBrown mb-8">Verification That Works</h3>

            {/* Step 1 */}
            <div className="flex gap-4 p-6 rounded-2xl bg-white border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-bold text-darkBrown mb-1">College Email</h4>
                <p className="text-sm text-softBrown">Your .edu email confirms you're a current student</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 p-6 rounded-2xl bg-white border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-bold text-darkBrown mb-1">Face ID Verification</h4>
                <p className="text-sm text-softBrown">Real-time liveness check prevents catfishing</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 p-6 rounded-2xl bg-white border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-bold text-darkBrown mb-1">Student ID Check</h4>
                <p className="text-sm text-softBrown">Valid student ID confirms enrollment status</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4 p-6 rounded-2xl bg-white border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                ✓
              </div>
              <div>
                <h4 className="font-bold text-darkBrown mb-1">Verified Badge</h4>
                <p className="text-sm text-softBrown">Show your verified status to build trust</p>
              </div>
            </div>
          </div>

          {/* Right: Safety Features */}
          <div className="animate-fade-in-right space-y-6">
            <h3 className="text-2xl font-bold text-darkBrown mb-8">Safety You Can Trust</h3>

            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <span className="text-4xl">🚫</span>
                <div>
                  <h4 className="font-bold text-darkBrown mb-1">Zero Tolerance Policy</h4>
                  <p className="text-sm text-softBrown">Harassment, hate speech, or inappropriate behavior results in instant removal</p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <span className="text-4xl">📋</span>
                <div>
                  <h4 className="font-bold text-darkBrown mb-1">Community Guidelines</h4>
                  <p className="text-sm text-softBrown">Clear rules ensure respectful interactions. Report violations anytime</p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <span className="text-4xl">🛡️</span>
                <div>
                  <h4 className="font-bold text-darkBrown mb-1">AI Moderation</h4>
                  <p className="text-sm text-softBrown">Advanced AI flags suspicious profiles and harmful content in real-time</p>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <span className="text-4xl">👥</span>
                <div>
                  <h4 className="font-bold text-darkBrown mb-1">Human Review Team</h4>
                  <p className="text-sm text-softBrown">Our team reviews all reports personally for fair, fast resolution</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy First Messaging */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-8 md:p-12 text-white text-center animate-fade-in-up mb-16">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">Your Privacy Is Our Priority</h3>
          <p className="text-lg mb-8 max-w-3xl mx-auto leading-relaxed">
            We believe privacy is a human right. Your data isn't sold, shared, or used for ads. Your conversations are encrypted. Your location is private until you share it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm font-bold">
            <div>✓ GDPR Compliant</div>
            <div>✓ No Data Selling</div>
            <div>✓ Encrypted by Default</div>
            <div>✓ Delete Anytime</div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center animate-fade-in-up">
          <h3 className="text-2xl font-bold text-darkBrown mb-4">Join the Safest Campus Dating Platform</h3>
          <p className="text-lg text-softBrown mb-8">
            Verified students. Private conversations. Real connections. No compromises.
          </p>
          <button className="btn-primary">Get Started With Verification 🔐</button>
        </div>
      </div>
    </section>
  );
}
