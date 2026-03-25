import React from 'react';

export default function Safety() {
  return (
    <div className="pt-20 pb-20">
      <section className="bg-gradient-to-br from-creamyWhite to-warmCream py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-darkBrown text-center mb-4">🛡️ Safety Guidelines</h1>
          <p className="text-lg text-softBrown text-center mb-12">
            Your safety is our priority. Follow these guidelines to have a safe and positive experience on CU Daters.
          </p>

          {/* Report & Support */}
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-red-600 mb-4">⚠️ Report Unsafe Behavior</h2>
            <p className="text-softBrown mb-6">If you encounter inappropriate behavior, harassment, or feel unsafe:</p>
            <div className="space-y-3">
              <p className="text-darkBrown"><strong>1. Report:</strong> Use the in-app report feature on any profile or conversation</p>
              <p className="text-darkBrown"><strong>2. Block:</strong> Immediately block the user to prevent further contact</p>
              <p className="text-darkBrown"><strong>3. Contact Us:</strong> Email safety@cudaters.tech with details</p>
              <p className="text-darkBrown"><strong>4. Law Enforcement:</strong> For serious crimes, contact local authorities immediately</p>
            </div>
          </div>

          {/* Safety Tips */}
          <div className="grid md:grid-cols-2 gap-8 my-12">
            <div className="card">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-bold text-darkBrown mb-3">Online Safety</h3>
              <ul className="space-y-2 text-softBrown text-sm">
                <li>✓ Never share passwords, OTPs, or personal credentials</li>
                <li>✓ Don't share your location until you trust someone</li>
                <li>✓ Keep sensitive information private initially</li>
                <li>✓ Use the anonymous system—reveal gradually</li>
                <li>✓ Screenshot alerts mean your privacy is protected</li>
              </ul>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">👔</div>
              <h3 className="text-xl font-bold text-darkBrown mb-3">Meeting in Person</h3>
              <ul className="space-y-2 text-softBrown text-sm">
                <li>✓ Meet in public places first (cafes, campus spaces)</li>
                <li>✓ Tell a trusted friend where you're going</li>
                <li>✓ Share your location with a friend during the meetup</li>
                <li>✓ Trust your gut feelings—if something feels off, leave</li>
                <li>✓ Use your own transportation or a trusted service</li>
              </ul>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-bold text-darkBrown mb-3">Red Flags to Watch</h3>
              <ul className="space-y-2 text-softBrown text-sm">
                <li>✓ Asking for money or financial information</li>
                <li>✓ Pressuring you to move off the app quickly</li>
                <li>✓ Creating fake profile with others' photos</li>
                <li>✓ Asking for intimate photos or verification</li>
                <li>✓ Being evasive about their real identity</li>
              </ul>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold text-darkBrown mb-3">Healthy Interactions</h3>
              <ul className="space-y-2 text-softBrown text-sm">
                <li>✓ Communicate clearly and respectfully</li>
                <li>✓ Be honest about what you're looking for</li>
                <li>✓ Respect boundaries and consent always</li>
                <li>✓ No means no—accept rejection gracefully</li>
                <li>✓ Treat others the way you want to be treated</li>
              </ul>
            </div>
          </div>

          {/* Verification Info */}
          <div className="bg-white rounded-2xl p-8 border-2 border-softPink my-12">
            <h2 className="text-2xl font-bold text-darkBrown mb-6">🆔 Our Verification System Protects You</h2>
            <p className="text-softBrown mb-6">Every profile on CU Daters is verified through:</p>
            <div className="space-y-3 text-softBrown">
              <p className="flex items-start gap-3">
                <span className="text-blushPink font-bold">1.</span>
                <span><strong>College Email:</strong> Only @culkomail.in & @cumail.in emails allowed</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-blushPink font-bold">2.</span>
                <span><strong>Face ID:</strong> Anti-spoofing technology prevents fake profiles</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-blushPink font-bold">3.</span>
                <span><strong>Student ID:</strong> We verify you're actually a CU student</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-blushPink font-bold">4.</span>
                <span><strong>Admin Review:</strong> Final approval ensures profile legitimacy</span>
              </p>
            </div>
          </div>

          {/* Report Process */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-200">
            <h2 className="text-2xl font-bold text-darkBrown mb-6">📋 How We Handle Reports</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="text-3xl font-bold text-blushPink">1</div>
                <div>
                  <h4 className="font-bold text-darkBrown">You Report</h4>
                  <p className="text-softBrown text-sm">Use the report feature on any profile or message</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-3xl font-bold text-blushPink">2</div>
                <div>
                  <h4 className="font-bold text-darkBrown">We Review</h4>
                  <p className="text-softBrown text-sm">Safety team reviews within 24 hours</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-3xl font-bold text-blushPink">3</div>
                <div>
                  <h4 className="font-bold text-darkBrown">We Act</h4>
                  <p className="text-softBrown text-sm">Warning, suspension, or permanent ban depending on severity</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-3xl font-bold text-blushPink">4</div>
                <div>
                  <h4 className="font-bold text-darkBrown">We Follow Up</h4>
                  <p className="text-softBrown text-sm">You'll be notified of the action taken</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <h3 className="text-2xl font-bold text-darkBrown mb-4">Need Help or Have Questions?</h3>
            <p className="text-softBrown mb-6">Contact our safety team anytime</p>
            <a href="mailto:safety@cudaters.tech" className="inline-block px-8 py-3 bg-gradient-to-r from-blushPink to-softPink text-white font-bold rounded-full hover:shadow-lg transition">
              Contact Safety Team
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
