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

  const appName = legal.appName || 'CU-Daters';
  const companyName = legal.companyName || appName;
  const privacyEmail = legal.privacyEmail || 'privacy@cudaters.in';
  const privacyLastUpdated = legal.privacyLastUpdated || 'March 2026';
  const mailingAddress = legal.mailingAddress || 'Chandigarh University, Chandigarh, India';

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
            <h2 className="text-2xl font-bold text-darkBrown mb-4">Contact Us</h2>
            <p className="text-softBrown">
              For privacy requests or concerns, contact <strong>{privacyEmail}</strong>.
            </p>
            <p className="text-softBrown mt-3">
              <strong>Address:</strong> {mailingAddress}
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
