import React from 'react';

export default function CookiePolicy() {
  return (
    <div className="pt-20 pb-20">
      <section className="bg-gradient-to-br from-creamyWhite to-warmCream py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-darkBrown text-center mb-4">🍪 Cookie Policy</h1>
          <p className="text-lg text-softBrown text-center mb-12">
            Last Updated: March 2026
          </p>

          {/* Content */}
          <div className="space-y-8">
            {/* Section 1 */}
            <div className="bg-white rounded-2xl p-8 border-2 border-softPink">
              <h2 className="text-2xl font-bold text-darkBrown mb-4">1. What Are Cookies?</h2>
              <p className="text-softBrown leading-relaxed">
                Cookies are small text files stored on your device when you visit our website or use our app. They help us remember your preferences and improve your experience on SeeU-Daters. Cookies can be "persistent" (stored for a longer period) or "session" (deleted when you close your browser).
              </p>
            </div>

            {/* Section 2 */}
            <div className="bg-white rounded-2xl p-8 border-2 border-softPink">
              <h2 className="text-2xl font-bold text-darkBrown mb-4">2. Types of Cookies We Use</h2>
              <div className="space-y-4 text-softBrown">
                <div>
                  <h4 className="font-bold text-darkBrown mb-2">Essential Cookies</h4>
                  <p>Required for the app to function (authentication, security, session management). These cannot be disabled.</p>
                </div>
                <div>
                  <h4 className="font-bold text-darkBrown mb-2">Performance Cookies</h4>
                  <p>Help us understand how you use SeeU-Daters (page views, crash reports, load times). This helps us improve performance.</p>
                </div>
                <div>
                  <h4 className="font-bold text-darkBrown mb-2">Analytics Cookies</h4>
                  <p>Track usage patterns to help us understand user behavior and make better product decisions (Google Analytics).</p>
                </div>
                <div>
                  <h4 className="font-bold text-darkBrown mb-2">Marketing Cookies</h4>
                  <p>Used to show you relevant ads and track marketing campaign effectiveness. You can opt-out anytime.</p>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-white rounded-2xl p-8 border-2 border-softPink">
              <h2 className="text-2xl font-bold text-darkBrown mb-4">3. How We Use Cookies</h2>
              <ul className="space-y-3 text-softBrown">
                <li className="flex items-start gap-3">
                  <span className="text-blushPink font-bold">✓</span>
                  <span>Keep you logged in securely</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blushPink font-bold">✓</span>
                  <span>Remember your preferences and settings</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blushPink font-bold">✓</span>
                  <span>Detect and prevent fraud and security issues</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blushPink font-bold">✓</span>
                  <span>Measure website traffic and performance</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blushPink font-bold">✓</span>
                  <span>Understand user behavior and improve features</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blushPink font-bold">✓</span>
                  <span>Personalize your content and recommendations</span>
                </li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="bg-white rounded-2xl p-8 border-2 border-softPink">
              <h2 className="text-2xl font-bold text-darkBrown mb-4">4. Third-Party Cookies</h2>
              <p className="text-softBrown leading-relaxed mb-4">
                We work with trusted partners who may place cookies on your device:
              </p>
              <div className="space-y-2 text-softBrown">
                <p><strong>Google Analytics:</strong> Tracks user behavior to help us understand usage patterns</p>
                <p><strong>Firebase:</strong> Helps with authentication and app performance monitoring</p>
                <p><strong>Advertising Partners:</strong> May track your activity for personalized ads</p>
              </div>
            </div>

            {/* Section 5 */}
            <div className="bg-white rounded-2xl p-8 border-2 border-softPink">
              <h2 className="text-2xl font-bold text-darkBrown mb-4">5. Managing Your Cookie Preferences</h2>
              <p className="text-softBrown leading-relaxed mb-4">
                You can control cookies through your browser settings:
              </p>
              <ul className="space-y-3 text-softBrown">
                <li className="flex items-start gap-3">
                  <span className="text-blushPink font-bold">•</span>
                  <span><strong>Chrome:</strong> Settings → Privacy and security → Cookies</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blushPink font-bold">•</span>
                  <span><strong>Safari:</strong> Preferences → Privacy → Manage website data</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blushPink font-bold">•</span>
                  <span><strong>Firefox:</strong> Preferences → Privacy & Security → Cookies</span>
                </li>
              </ul>
              <p className="text-softBrown mt-4 text-sm italic">Note: Disabling essential cookies may affect app functionality.</p>
            </div>

            {/* Section 6 */}
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-8 border-2 border-rose-200">
              <h2 className="text-2xl font-bold text-darkBrown mb-4">6. Privacy & Security</h2>
              <p className="text-softBrown leading-relaxed mb-4">
                Your privacy matters to us. We:
              </p>
              <ul className="space-y-2 text-softBrown">
                <li className="flex items-start gap-3">
                  <span className="text-blushPink font-bold">✓</span>
                  <span>Never sell your data to third parties</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blushPink font-bold">✓</span>
                  <span>Encrypt sensitive information</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blushPink font-bold">✓</span>
                  <span>Comply with GDPR and privacy laws</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blushPink font-bold">✓</span>
                  <span>Only collect data necessary for our service</span>
                </li>
              </ul>
            </div>

            {/* Section 7 */}
            <div className="bg-white rounded-2xl p-8 border-2 border-softPink">
              <h2 className="text-2xl font-bold text-darkBrown mb-4">7. Updates to This Policy</h2>
              <p className="text-softBrown">
                We may update this Cookie Policy periodically. We'll notify you of significant changes via email or through our app. Your continued use of SeeU-Daters constitutes acceptance of the updated policy.
              </p>
            </div>

            {/* Contact */}
            <div className="bg-gradient-to-r from-blushPink to-softPink rounded-2xl p-8 text-white text-center">
              <h2 className="text-2xl font-bold mb-4">Questions About Our Cookie Policy?</h2>
              <p className="mb-6">Contact us anytime</p>
              <a href="mailto:privacy@seeu-daters.tech" className="inline-block px-8 py-3 bg-white text-blushPink font-bold rounded-full hover:scale-105 transition">
                Email Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
