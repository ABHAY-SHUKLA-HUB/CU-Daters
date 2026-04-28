import React, { useState } from 'react';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'Is my data really private on SeeU-Daters?',
      answer:
        'Yes. Your conversations are end-to-end encrypted, meaning only you and your match can read them. We physically cannot read your messages even if we tried. Your location is private until you share it manually. We don\'t sell your data or use it for ads. We comply with GDPR and can never share your data with third parties.',
    },
    {
      question: 'How does verification work?',
      answer:
        'We use a three-step verification process: (1) Email verification confirms account ownership, (2) Face ID verification prevents catfishing and fake accounts, (3) Government ID validation confirms you\'re a real person. This takes about 5 minutes and happens only once. Your verification badge shows on your profile to build trust.',
    },
    {
      question: 'Can I stay anonymous?',
      answer:
        'Absolutely. When you first join, your profile is completely anonymous. You can browse and chat with matches without revealing your name, photos, or any personal info. You control what to reveal and when. Both users must agree to reveal before your photos or name appear to each other.',
    },
    {
      question: 'What happens if someone is creepy or inappropriate?',
      answer:
        'You can block or report them instantly from any chat or profile. Reports go directly to our safety team for review. We have a zero-tolerance policy for harassment, hate speech, or inappropriate behavior. Violations result in immediate account removal. We also use AI to flag suspicious profiles in real-time.',
    },
    {
      question: 'How do I know other profiles are real?',
      answer:
        'Every profile on SeeU-Daters is verified through college email, student ID, and face ID. We have AI moderation that flags suspicious patterns and duplicate accounts. Our human review team manually checks flagged profiles. If it seems too good to be true, it probably failed verification.',
    },
    {
      question: 'Who is SeeU-Daters for?',
      answer:
        'SeeU-Daters is built for people who want safer, more intentional connections. Shared intent matters more than labels, so we focus on verified identity, privacy controls, and respectful conversation standards for everyone.',
    },
    {
      question: 'Can I delete my account and data?',
      answer:
        'Yes, anytime. You can delete your account from account settings, and all your data is permanently wiped from our servers within 30 days. We keep backups for compliance, but after 30 days, you\'re completely removed from our system. You can request a data export before deletion.',
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white via-creamyWhite to-white">
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="section-title mb-4">Frequently Asked Questions</h2>
          <p className="section-subtitle">
            Got questions? We've got answers. Can't find what you're looking for?{' '}
            <span className="text-blushPink font-bold cursor-pointer hover:underline">Contact us</span>.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="animate-fade-in-up opacity-0"
              style={{
                animationDelay: `${idx * 30}ms`,
                animationFillMode: 'forwards',
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full p-6 rounded-2xl bg-white border-2 border-softPink hover:border-blushPink hover:shadow-lg transition-all duration-300 text-left group"
              >
                {/* Question */}
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-bold text-darkBrown pr-6 group-hover:text-blushPink transition-colors">
                    {faq.question}
                  </h3>
                  <span
                    className={`text-2xl flex-shrink-0 transition-transform duration-300 ${
                      openIndex === idx ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </div>

                {/* Answer (Collapsed) */}
                {openIndex === idx && (
                  <div className="mt-4 pt-4 border-t border-softPink animate-fade-in-up">
                    <p className="text-softBrown leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Still Looking? */}
        <div className="mt-16 text-center p-8 rounded-2xl bg-gradient-to-r from-blushPink to-softPink bg-opacity-10 border-2 border-softPink animate-fade-in-up">
          <h3 className="text-xl font-bold text-darkBrown mb-3">Didn't find your answer?</h3>
          <p className="text-softBrown mb-6">
            Our support team is here to help. We respond within 24 hours.
          </p>
          <button className="btn-secondary">Contact Support 🤝</button>
        </div>
      </div>
    </section>
  );
}

