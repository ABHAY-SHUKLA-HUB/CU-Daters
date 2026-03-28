import useLegalContentConfig from '../hooks/useLegalContentConfig';
import useSupportContactConfig from '../hooks/useSupportContactConfig';

const FALLBACK_TERMS_BLOCKS = [
  {
    title: 'Eligibility',
    body: 'You must be at least 18 years old and a currently enrolled student at a recognized college or university to use SeeU Daters. You must provide truthful information during registration and verification.'
  },
  {
    title: 'Account & Verification',
    body: 'You agree to submit accurate information, including your full name, email, phone number, college, and a live photo + student ID for verification. Your account will be pending until approved by our platform team. You are responsible for maintaining the confidentiality of your password.'
  },
  {
    title: 'User Conduct',
    body: 'You agree not to:\n\n• Create fake, misleading, or unauthorized profiles.\n• Harass, threaten, or harm other users.\n• Post inappropriate, offensive, or illegal content.\n• Use the platform for commercial purposes.'
  },
  {
    title: 'Privacy',
    body: 'Your personal data is handled as described in our Privacy Policy. We take safety seriously – all conversations are private, and platform administrators do not read your messages except when required to investigate reports.'
  },
  {
    title: 'Termination',
    body: 'We reserve the right to suspend or delete any account that violates these Terms or our Safety Guidelines, without prior notice.'
  },
  {
    title: 'Limitation of Liability',
    body: 'SeeU Daters is provided "as is". We are not liable for any damages arising from your use of the platform, including offline interactions. You are solely responsible for your safety.'
  },
  {
    title: 'Changes to Terms',
    body: 'We may update these Terms from time to time. Continued use after changes constitutes acceptance.'
  }
];

export default function Terms() {
  const legal = useLegalContentConfig();
  const support = useSupportContactConfig();

  const appName = legal.appName || 'SeeU Daters';
  const companyName = legal.companyName || appName;
  const legalEmail = legal.legalEmail || 'support@cudaters.tech';
  const supportEmail = support.supportEmail || legal.supportEmail || 'support@cudaters.tech';
  const termsLastUpdated = legal.termsLastUpdated || 'March 28, 2026';
  const mailingAddress = legal.mailingAddress || 'SeeU-Daters Legal Desk, New Delhi, India';

  const blocks = Array.isArray(legal.termsBlocks) && legal.termsBlocks.length
    ? legal.termsBlocks
    : FALLBACK_TERMS_BLOCKS;

  return (
    <div className="pt-20 pb-20">
      <section className="bg-gradient-to-br from-creamyWhite to-warmCream py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-darkBrown mb-4">Terms of Service</h1>
          <p className="text-softBrown">Last Updated: {termsLastUpdated}</p>
        </div>
      </section>

      <section className="py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <p className="text-softBrown leading-relaxed">
              Welcome to <strong>SeeU Daters</strong> ("we", "our", "us"). By creating an account, you agree to these Terms. If you do not agree, please do not use our platform.
            </p>
          </div>

          {blocks.map((block, index) => (
            <div key={`${block?.title || 'terms'}-${index}`}>
              <h2 className="text-2xl font-bold text-darkBrown mb-4">{index + 1}. {block?.title || `Section ${index + 1}`}</h2>
              <p className="text-softBrown leading-relaxed whitespace-pre-wrap">{block?.body || ''}</p>
            </div>
          ))}

          <div>
            <h2 className="text-2xl font-bold text-darkBrown mb-4">Contact and Legal Support</h2>
            <p className="text-softBrown leading-relaxed">
              For legal queries, contact {companyName} at {legalEmail}. For account or subscription issues, contact {supportEmail}.
            </p>
            <p className="text-softBrown mt-4">
              <strong>Address:</strong> {mailingAddress}
            </p>
          </div>

          <div className="bg-softPink p-6 rounded-lg mt-8">
            <p className="text-darkBrown text-sm">
              By using {appName}, you acknowledge that you have read and accepted these Terms of Service.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

