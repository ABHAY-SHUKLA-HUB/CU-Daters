export default function Privacy() {
  return (
    <div className="pt-20 pb-20">
      <section className="bg-gradient-to-br from-creamyWhite to-warmCream py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-darkBrown mb-4">Privacy Policy</h1>
          <p className="text-softBrown">Last Updated: March 2026</p>
        </div>
      </section>

      <section className="py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-darkBrown mb-4">1. Introduction</h2>
            <p className="text-softBrown leading-relaxed">
              CU CRUSH ("we," "us," "our," or "Company") respects your privacy and is committed to protecting it. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application (the "App").
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-darkBrown mb-4">2. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-darkBrown mb-2">Personal Information:</h3>
                <ul className="text-softBrown space-y-2 ml-4">
                  <li>• Name, email address (CU email only), phone number</li>
                  <li>• Date of birth and age verification</li>
                  <li>• Profile photos (verified for authenticity)</li>
                  <li>• Student ID information and course details</li>
                  <li>• Bio, interests, gender, and year of study</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-darkBrown mb-2">Verification Data:</h3>
                <ul className="text-softBrown space-y-2 ml-4">
                  <li>• Facial recognition data for face detection</li>
                  <li>• Student ID card scans for verification</li>
                  <li>• Device information and location (if permitted)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-darkBrown mb-2">Usage Data:</h3>
                <ul className="text-softBrown space-y-2 ml-4">
                  <li>• Messages and chat history (encrypted)</li>
                  <li>• Likes, matches, and interaction patterns</li>
                  <li>• Device type, OS, app version, IP address</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-darkBrown mb-4">3. How We Use Your Information</h2>
            <ul className="text-softBrown space-y-2 ml-4">
              <li>• <strong>Account Creation & Management:</strong> Set up and maintain your CU CRUSH account</li>
              <li>• <strong>Verification:</strong> Confirm your identity and prevent fake profiles</li>
              <li>• <strong>Matching Algorithm:</strong> Provide personalized match recommendations</li>
              <li>• <strong>Communication:</strong> Send important updates, notifications, and support messages</li>
              <li>• <strong>Safety & Security:</strong> Detect fraud, prevent abuse, and respond to reports</li>
              <li>• <strong>Analytics:</strong> Understand user behavior and improve the App</li>
              <li>• <strong>Legal Compliance:</strong> Comply with laws and regulations</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-darkBrown mb-4">4. Data Retention</h2>
            <p className="text-softBrown mb-4">
              We retain your personal data only for as long as necessary:
            </p>
            <ul className="text-softBrown space-y-2 ml-4">
              <li>• <strong>Active Accounts:</strong> Data retained while account is active</li>
              <li>• <strong>Deleted Accounts:</strong> Data deleted within 30 days of account deletion</li>
              <li>• <strong>Chat History:</strong> Encrypted and retained for 7 days after deletion; then permanently removed</li>
              <li>• <strong>Report Data:</strong> Retained for 1 year to prevent repeat violations</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-darkBrown mb-4">5. Private Chats & Message Security</h2>
            <p className="text-softBrown mb-4">
              <strong>Important:</strong> We take chat privacy very seriously.
            </p>
            <ul className="text-softBrown space-y-2 ml-4">
              <li>• ✓ All messages are end-to-end encrypted</li>
              <li>• ✓ <strong>Admin Cannot View Chats:</strong> Only users can see their own conversations</li>
              <li>• ✓ Reports are based on user complaints, not monitoring</li>
              <li>• ✓ Even deleted chats cannot be recovered by our team</li>
              <li>• ✗ CU CRUSH does NOT monitor, read, or store unencrypted chat content</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-darkBrown mb-4">6. Data Sharing & Third Parties</h2>
            <p className="text-softBrown mb-4">
              We only share your data with trusted third parties for specific purposes:
            </p>
            <ul className="text-softBrown space-y-2 ml-4">
              <li>• <strong>Payment Processors:</strong> Stripe, PayU, RazorPay (for subscription payments)</li>
              <li>• <strong>Cloud Services:</strong> AWS, Firebase (for hosting and storage)</li>
              <li>• <strong>Face Recognition:</strong> AWS Rekognition or Google ML Kit (for verification only)</li>
              <li>• <strong>Analytics:</strong> Firebase Analytics, Mixpanel (anonymized data)</li>
              <li>• <strong>Legal Compliance:</strong> Government agencies (only when legally required)</li>
            </ul>
            <p className="text-softBrown mt-4 font-bold">
              We never sell your personal data to third parties.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-darkBrown mb-4">7. Your Data Rights</h2>
            <p className="text-softBrown mb-4">You have the right to:</p>
            <ul className="text-softBrown space-y-2 ml-4">
              <li>• <strong>Access:</strong> Request a copy of all data we hold about you</li>
              <li>• <strong>Correction:</strong> Update or correct inaccurate information</li>
              <li>• <strong>Deletion:</strong> Request account and data deletion (GDPR/CCPA compliant)</li>
              <li>• <strong>Portability:</strong> Export your data in a standard format</li>
              <li>• <strong>Opt-Out:</strong> Disable marketing communications anytime</li>
            </ul>
            <p className="text-softBrown mt-4">
              Contact support@seeu-daters.tech to exercise any of these rights.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-darkBrown mb-4">8. Security Measures</h2>
            <ul className="text-softBrown space-y-2 ml-4">
              <li>• HTTPS/TLS encryption for all data in transit</li>
              <li>• AES-256 encryption for data at rest</li>
              <li>• Secure password hashing (bcrypt)</li>
              <li>• Two-factor authentication available (coming soon)</li>
              <li>• Regular security audits and penetration testing</li>
              <li>• Restricted admin access with audit logs</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-darkBrown mb-4">9. Children's Privacy</h2>
            <p className="text-softBrown">
              CU CRUSH is only for users 18 years or older. We do not knowingly collect data from minors. If we learn that someone under 18 is using our App, we will delete their account immediately.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-darkBrown mb-4">10. Changes to This Policy</h2>
            <p className="text-softBrown">
              We may update this Privacy Policy periodically. Significant changes will be notified via email or in-app notification. Continued use of CU CRUSH after changes means you accept the new policy.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-darkBrown mb-4">11. Contact Us</h2>
            <p className="text-softBrown">
              For privacy concerns or questions, contact us at:
            </p>
            <p className="text-softBrown mt-4">
              <strong>Email:</strong> support@seeu-daters.tech<br/>
              <strong>Mailing Address:</strong> Chandigarh University, Chandigarh, India
            </p>
          </div>

          <div className="bg-softPink p-6 rounded-lg mt-8">
            <p className="text-darkBrown text-sm">
              <strong>Last Updated:</strong> March 18, 2026<br/>
              <strong>Version:</strong> 1.0
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
