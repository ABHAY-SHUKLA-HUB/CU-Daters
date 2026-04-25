import useLegalContentConfig from '../hooks/useLegalContentConfig';

const FALLBACK_PRIVACY_BLOCKS = [
  {
    title: 'Information We Collect',
    body: 'We collect profile, account, and usage data required to operate the service, secure accounts, and improve platform reliability.'
  },
  {
    title: 'How We Use Information',
    body: 'Data is used for account operations, service personalization, moderation and trust-and-safety controls, support, and legal compliance.'
  },
  {
    title: 'Data Sharing',
    body: 'We share data only with approved processors and service partners needed to run the platform. We do not sell personal data.'
  },
  {
    title: 'Data Security and Retention',
    body: 'We apply technical and operational safeguards and retain data only for permitted business or legal periods.'
  },
  {
    title: 'Your Privacy Rights',
    body: 'Users can request access, correction, export, or deletion of eligible data according to applicable law and policy.'
  }
];

export default function Privacy() {
  const legal = useLegalContentConfig();

  const appName = legal.appName || 'SeeU-Daters';
  const companyName = legal.companyName || appName;
  const privacyEmail = legal.privacyEmail || 'privacy@seeudaters.in';
  const privacyLastUpdated = legal.privacyLastUpdated || 'March 2026';
  const mailingAddress = legal.mailingAddress || 'SeeU-Daters Legal Desk, New Delhi, India';

  const blocks = Array.isArray(legal.privacyBlocks) && legal.privacyBlocks.length
    ? legal.privacyBlocks
    : FALLBACK_PRIVACY_BLOCKS;

  return (
    <div className="pt-20 pb-20">
      <section className="bg-gradient-to-br from-creamyWhite to-warmCream py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-darkBrown mb-4">Privacy Policy</h1>
          <p className="text-softBrown">Last Updated: {privacyLastUpdated}</p>
        </div>
      </section>

      <section className="py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-darkBrown mb-4">Introduction</h2>
            <p className="text-softBrown leading-relaxed">
              {companyName} is committed to protecting user privacy and applying responsible data handling standards across the platform.
            </p>
          </div>

          {blocks.map((block, index) => (
            <div key={`${block?.title || 'privacy'}-${index}`}>
              <h2 className="text-2xl font-bold text-darkBrown mb-4">{index + 1}. {block?.title || `Section ${index + 1}`}</h2>
              <p className="text-softBrown leading-relaxed whitespace-pre-wrap">{block?.body || ''}</p>
            </div>
          ))}

          <div>
<<<<<<< HEAD
            <h2 className="text-2xl font-bold text-darkBrown mb-4">Contact Us</h2>
=======
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
>>>>>>> 8603a53246669d81d74718efbf0c3d1aa17377ae
            <p className="text-softBrown">
              For privacy requests or concerns, contact <strong>{privacyEmail}</strong>.
            </p>
<<<<<<< HEAD
            <p className="text-softBrown mt-3">
              <strong>Address:</strong> {mailingAddress}
=======
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
>>>>>>> 8603a53246669d81d74718efbf0c3d1aa17377ae
            </p>
          </div>

          <div className="bg-softPink p-6 rounded-lg mt-8">
            <p className="text-darkBrown text-sm">
              <strong>Last Updated:</strong> {privacyLastUpdated}<br />
              <strong>Version:</strong> 2.0
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

