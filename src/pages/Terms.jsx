import useLegalContentConfig from '../hooks/useLegalContentConfig';
import useSupportContactConfig from '../hooks/useSupportContactConfig';

const FALLBACK_TERMS_BLOCKS = [
  {
    title: 'Acceptance of Terms',
    body: 'By using this platform, you agree to these terms and any policy updates communicated by the company.'
  },
  {
    title: 'Eligibility and Account Rules',
    body: 'Users must meet platform eligibility requirements and provide accurate account details. Impersonation or misleading identity information is prohibited.'
  },
  {
    title: 'Community Conduct',
    body: 'Harassment, abuse, hate speech, fraud, and illegal activity are not allowed. Violations can lead to account restriction or permanent removal.'
  },
  {
    title: 'Subscriptions and Billing',
    body: 'Paid plans, renewals, and eligibility for refunds are governed by the current billing policy shown in the app at the time of purchase.'
  },
  {
    title: 'Disputes and Governing Law',
    body: 'Disputes should be raised through official support channels first. Governing law and arbitration jurisdiction follow legal metadata configured by the platform.'
  }
];

export default function Terms() {
  const legal = useLegalContentConfig();
  const support = useSupportContactConfig();

  const appName = legal.appName || 'SeeU-Daters';
  const companyName = legal.companyName || appName;
  const legalEmail = legal.legalEmail || 'legal@seeudaters.in';
  const supportEmail = support.supportEmail || legal.supportEmail || 'support@seeudaters.in';
  const termsLastUpdated = legal.termsLastUpdated || 'March 2026';
  const mailingAddress = legal.mailingAddress || 'Chandigarh University, Chandigarh, India';

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

