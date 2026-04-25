import React, { useState } from 'react';

export default function Contact() {
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
            <a href="mailto:support@seeu-daters.tech" className="text-blushPink font-bold hover:underline">
              support@seeu-daters.tech
            </a>
          </div>

          <div className="card text-center">
            <div className="text-5xl mb-4">🚨</div>
            <h3 className="text-xl font-bold text-darkBrown mb-2">Safety Issues</h3>
            <p className="text-softBrown mb-4">
              Report harassment, abuse, or fake profiles
            </p>
            <a href="mailto:seeu-daters.verify@gmail.com" className="text-blushPink font-bold hover:underline">
              seeu-daters.verify@gmail.com
            </a>
          </div>

          <div className="card text-center">
            <div className="text-5xl mb-4">👨‍💼</div>
            <h3 className="text-xl font-bold text-darkBrown mb-2">Admin Access</h3>
            <p className="text-softBrown mb-4">
              For verification or admin queries
            </p>
            <a href="mailto:info@seeu-daters.tech" className="text-blushPink font-bold hover:underline">
              info@seeu-daters.tech
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
                a: 'Refunds are available within 48 hours of purchase if you haven\'t used premium features. Contact support@seeu-daters.tech for assistance.'
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
                a: 'Contact info@seeu-daters.tech with your verification details. Our admin team will review and update your profile.'
              },
              {
                q: 'Is CU CRUSH available on web?',
                a: 'Currently, CU CRUSH is available on iOS and Android. A web version is in development and coming soon!'
              },
              {
                q: 'Can I use CU CRUSH if I\'m not a CU student?',
                a: 'Currently, CU CRUSH is exclusive to Chandigarh University students. We\'re expanding to other colleges soon!'
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
            <a href="#" className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl hover:bg-blushPink hover:text-white transition">
              f
            </a>
            <a href="#" className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl hover:bg-blushPink hover:text-white transition">
              📷
            </a>
            <a href="#" className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl hover:bg-blushPink hover:text-white transition">
              𝕏
            </a>
            <a href="#" className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl hover:bg-blushPink hover:text-white transition">
              👥
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
