import React, { useState } from 'react';
import useSupportContactConfig from '../hooks/useSupportContactConfig';

export default function Contact() {
  const contactConfig = useSupportContactConfig();
  const supportEmail = contactConfig.supportEmail || 'support@seeudaters.in';
  const escalationEmail = contactConfig.escalationEmail || supportEmail;
  const adminEmail = escalationEmail;
  const supportPhone = contactConfig.supportPhone || contactConfig.whatsapp || '+91 00000 00000';
  const instagramHref = contactConfig.instagramId ? `https://instagram.com/${String(contactConfig.instagramId).replace(/^@/, '')}` : '#';
  const telegramHref = contactConfig.telegramId ? `https://t.me/${String(contactConfig.telegramId).replace(/^@/, '')}` : '#';
  const helpCenterHref = contactConfig.helpCenterUrl || '#';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="pt-20 pb-20">
      {/* Hero */}
      <section className="bg-gradient-to-br from-creamyWhite to-warmCream py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-darkBrown mb-6">
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="text-xl text-softBrown max-w-2xl mx-auto">
            Have questions? Want to report an issue? Found a bug? We'd love to hear from you!
          </p>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="text-5xl mb-4">📧</div>
            <h3 className="text-xl font-bold text-darkBrown mb-2">Email</h3>
            <p className="text-softBrown mb-4">
              For general inquiries and support
            </p>
<<<<<<< HEAD
            <a href={`mailto:${supportEmail}`} className="text-blushPink font-bold hover:underline">
              {supportEmail}
=======
            <a href="mailto:support@seeu-daters.tech" className="text-blushPink font-bold hover:underline">
              support@seeu-daters.tech
>>>>>>> 8603a53246669d81d74718efbf0c3d1aa17377ae
            </a>
          </div>

          <div className="card text-center">
            <div className="text-5xl mb-4">🚨</div>
            <h3 className="text-xl font-bold text-darkBrown mb-2">Safety Issues</h3>
            <p className="text-softBrown mb-4">
              Report harassment, abuse, or fake profiles
            </p>
<<<<<<< HEAD
            <a href={`mailto:${escalationEmail}`} className="text-blushPink font-bold hover:underline">
              {escalationEmail}
=======
            <a href="mailto:seeu-daters.verify@gmail.com" className="text-blushPink font-bold hover:underline">
              seeu-daters.verify@gmail.com
>>>>>>> 8603a53246669d81d74718efbf0c3d1aa17377ae
            </a>
          </div>

          <div className="card text-center">
            <div className="text-5xl mb-4">👨‍💼</div>
            <h3 className="text-xl font-bold text-darkBrown mb-2">Admin Access</h3>
            <p className="text-softBrown mb-4">
              For verification or admin queries
            </p>
<<<<<<< HEAD
            <a href={`mailto:${adminEmail}`} className="text-blushPink font-bold hover:underline">
              {adminEmail}
=======
            <a href="mailto:info@seeu-daters.tech" className="text-blushPink font-bold hover:underline">
              info@seeu-daters.tech
>>>>>>> 8603a53246669d81d74718efbf0c3d1aa17377ae
            </a>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 px-4 bg-warmCream">
        <div className="max-w-3xl mx-auto">
          <h2 className="section-title text-center">Send Us a Message</h2>
          
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg mt-8">
            <div className="mb-6">
              <label className="block text-darkBrown font-bold mb-2">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blushPink focus:outline-none"
                placeholder="Your name"
              />
            </div>

            <div className="mb-6">
              <label className="block text-darkBrown font-bold mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blushPink focus:outline-none"
                placeholder="your@email.com"
              />
            </div>

            <div className="mb-6">
              <label className="block text-darkBrown font-bold mb-2">Subject *</label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blushPink focus:outline-none"
              >
                <option value="">Select Subject</option>
                <option value="general">General Inquiry</option>
                <option value="support">Support Request</option>
                <option value="bug">Report Bug</option>
                <option value="suggestion">Feature Suggestion</option>
                <option value="business">Business Inquiry</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-darkBrown font-bold mb-2">Message *</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="6"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blushPink focus:outline-none resize-none"
                placeholder="Your message here..."
              ></textarea>
            </div>

            <button type="submit" className="btn-primary w-full text-lg">
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-title text-center">Frequently Asked Questions</h2>

          <div className="space-y-6 mt-12">
            {[
              {
                q: 'What is the response time for emails?',
                a: 'We try to respond within 24-48 hours. Safety issues are prioritized and responded to within 12 hours.'
              },
              {
                q: 'How do I report a fake profile?',
                a: 'Use the Report button on any profile in the app. Our team reviews reports within 24 hours and takes action accordingly.'
              },
              {
                q: 'Can I request a refund?',
<<<<<<< HEAD
                a: `Refunds are available within 48 hours of purchase if you haven't used premium features. Contact ${supportEmail} for assistance.`
=======
                a: 'Refunds are available within 48 hours of purchase if you haven\'t used premium features. Contact support@seeu-daters.tech for assistance.'
>>>>>>> 8603a53246669d81d74718efbf0c3d1aa17377ae
              },
              {
                q: 'How do I delete my account?',
                a: 'Go to Settings > Account > Delete Account. Your account and all data will be permanently deleted within 30 days.'
              },
              {
                q: 'I forgot my password. What do I do?',
                a: 'Click "Forgot Password" on the login screen. We\'ll send a reset link to your registered email within minutes.'
              },
              {
                q: 'How do I update my verification information?',
<<<<<<< HEAD
                a: `Contact ${adminEmail} with your verification details. Our admin team will review and update your profile.`
=======
                a: 'Contact info@seeu-daters.tech with your verification details. Our admin team will review and update your profile.'
>>>>>>> 8603a53246669d81d74718efbf0c3d1aa17377ae
              },
              {
                q: 'Is SeeU-Daters available on web?',
                a: 'Yes. SeeU-Daters is available on web and also works great on mobile browsers.'
              },
              {
                q: 'Is SeeU-Daters limited to one institution or group?',
                a: 'No. SeeU-Daters is an independent platform open to people across different communities and backgrounds.'
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-creamyWhite p-6 rounded-lg border-l-4 border-blushPink">
                <h4 className="font-bold text-darkBrown mb-2">Q: {item.q}</h4>
                <p className="text-softBrown">A: {item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Media / Support */}
      <section className="py-16 px-4 bg-softPink">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-darkBrown mb-8">Follow Us</h2>
          <div className="flex justify-center gap-8">
            <a href={`mailto:${supportEmail}`} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl hover:bg-blushPink hover:text-white transition" title={supportEmail}>
              f
            </a>
            <a href={instagramHref} target={instagramHref === '#' ? undefined : '_blank'} rel={instagramHref === '#' ? undefined : 'noreferrer'} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl hover:bg-blushPink hover:text-white transition" title={contactConfig.instagramId || 'Instagram'}>
              📷
            </a>
            <a href={helpCenterHref} target={helpCenterHref === '#' ? undefined : '_blank'} rel={helpCenterHref === '#' ? undefined : 'noreferrer'} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl hover:bg-blushPink hover:text-white transition" title="Help Center">
              𝕏
            </a>
            <a href={telegramHref} target={telegramHref === '#' ? undefined : '_blank'} rel={telegramHref === '#' ? undefined : 'noreferrer'} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl hover:bg-blushPink hover:text-white transition" title={contactConfig.telegramId || supportPhone}>
              👥
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

