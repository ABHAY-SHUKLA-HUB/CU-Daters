import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Users, Zap, Lock, Clock, Headphones, ChevronDown, ChevronUp, ArrowRight, Shield, Sparkles, Lightbulb, Award } from 'lucide-react';
import SupportModal from '../components/support/SupportModal';
import '../styles/Contact.css';

const Contact = () => {
  const [showSupport, setShowSupport] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [particles, setParticles] = useState([]);

  // Generate animated particles
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 15 + Math.random() * 10,
    }));
    setParticles(newParticles);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const categories = [
    { icon: '✓', title: 'Verification Help', desc: 'Get assistance with profile verification process' },
    { icon: '🔑', title: 'Login Issues', desc: 'Recover access and security recovery options' },
    { icon: '🚩', title: 'Report Fake Profiles', desc: 'Report suspicious or fake accounts instantly' },
    { icon: '💳', title: 'Payment & Billing', desc: 'Subscription and payment support' },
    { icon: '🐛', title: 'Technical Support', desc: 'Report app bugs and technical issues' },
    { icon: '🔒', title: 'Safety & Privacy', desc: 'Security concerns and privacy questions' },
  ];

  const features = [
    { icon: MessageCircle, title: 'Real-Time Chat', desc: 'Instant messaging with support agents' },
    { icon: Zap, title: 'AI Assistant', desc: 'Intelligent responses in seconds' },
    { icon: Users, title: 'Expert Support', desc: 'Dedicated human support team' },
    { icon: Shield, title: 'Secure Chats', desc: 'Military-grade encryption' },
    { icon: Clock, title: '<2 Min Response', desc: 'Average response time guaranteed' },
    { icon: Award, title: '24/7 Support', desc: 'Always available for you' },
  ];

  const steps = [
    { number: '1', title: 'Create Request', desc: 'Describe your issue' },
    { number: '2', title: 'AI Joins', desc: 'Instant assistance' },
    { number: '3', title: 'Team Accepts', desc: 'Human takes over' },
    { number: '4', title: 'Issue Resolved', desc: 'Fast resolution' },
  ];

  const faqs = [
    { question: 'How does the verification process work?', answer: 'Verification ensures all profiles are verified and authentic. Submit a valid ID and a selfie, and our team approves within 24 hours. This keeps our community safe and trustworthy.' },
    { question: 'Why was my profile rejected?', answer: 'Profiles are rejected if photos don\'t match ID, violate community guidelines, contain inappropriate content, or fail safety checks. Contact support for specific feedback.' },
    { question: 'How do I report fake or suspicious users?', answer: 'Visit their profile, tap the three dots menu, and select "Report". Our moderation team reviews every report within 2 hours and takes immediate action.' },
    { question: 'How quickly will I get support?', answer: 'Our average response time is under 2 minutes. AI assistants provide instant help, while human agents handle complex issues. No waiting around!' },
    { question: 'Is my support conversation completely private?', answer: 'Yes! All conversations are end-to-end encrypted with military-grade security. Only you and our support staff can see your messages.' },
    { question: 'What payment methods do you accept?', answer: 'We accept all major credit/debit cards, UPI, net banking, and digital wallets. All transactions are secure and processed instantly.' },
  ];

  return (
    <div className="contact-page">
      {/* ========== HERO SECTION ========== */}
      <section className="hero-section">
        <div className="particles-container">
          {particles.map(p => (
            <motion.div
              key={p.id}
              className="particle"
              style={{ left: `${p.left}%` }}
              animate={{ y: [0, -400] }}
              transition={{ duration: p.duration, delay: p.delay, repeat: Infinity }}
            />
          ))}
        </div>

        <div className="hero-gradient"></div>

        <motion.div className="hero-content" variants={containerVariants} initial="hidden" animate="visible">
          <motion.h1 variants={itemVariants} className="hero-title">
            Need Help? We're Here For You.
          </motion.h1>

          <motion.p variants={itemVariants} className="hero-subtitle">
            Connect instantly with the SeeU Daters support team through our premium live support system.
          </motion.p>

          <motion.div variants={itemVariants} className="hero-buttons">
            <button className="btn-primary" onClick={() => setShowSupport(true)}>
              <Zap size={20} /> Start Live Support
            </button>
            <button className="btn-secondary">
              Help Center <ArrowRight size={20} />
            </button>
          </motion.div>

          <motion.div variants={itemVariants} className="online-badge">
            <span className="pulse-dot"></span>
            12 Support Agents Online
          </motion.div>

          <motion.div variants={itemVariants} className="stats-row">
            <div className="stat-card">
              <div className="stat-value">2 min</div>
              <div className="stat-label">Avg Response</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">98%</div>
              <div className="stat-label">Resolved</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">1.2K</div>
              <div className="stat-label">Today Helped</div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ========== SUPPORT CATEGORIES ========== */}
      <section className="categories-section">
        <motion.h2 variants={itemVariants} initial="hidden" whileInView="visible" className="section-title">
          Get Help With Anything
        </motion.h2>

        <motion.div
          className="categories-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {categories.map((cat, i) => (
            <motion.div key={i} variants={itemVariants} className="category-card">
              <div className="category-icon">{cat.icon}</div>
              <h3>{cat.title}</h3>
              <p>{cat.desc}</p>
              <div className="card-border"></div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ========== FEATURES SHOWCASE ========== */}
      <section className="features-section">
        <motion.h2 variants={itemVariants} initial="hidden" whileInView="visible" className="section-title">
          Why Choose SeeU Support
        </motion.h2>

        <motion.div
          className="features-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div key={i} variants={itemVariants} className="feature-card">
                <div className="feature-icon">
                  <Icon size={32} />
                </div>
                <h3>{feat.title}</h3>
                <p>{feat.desc}</p>
                <div className="glow-effect"></div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="timeline-section">
        <motion.h2 variants={itemVariants} initial="hidden" whileInView="visible" className="section-title">
          How Support Works
        </motion.h2>

        <motion.div
          className="timeline-container"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {steps.map((step, i) => (
            <div key={i}>
              <motion.div variants={itemVariants} className="timeline-step">
                <div className="step-circle">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </motion.div>

              {i < steps.length - 1 && (
                <motion.div
                  className="timeline-connector"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ delay: i * 0.2 + 0.5 }}
                  viewport={{ once: true }}
                >
                  <ArrowRight size={24} />
                </motion.div>
              )}
            </div>
          ))}
        </motion.div>
      </section>

      {/* ========== SUPPORT PORTAL ========== */}
      <section className="portal-section">
        <motion.div
          className="portal-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="portal-glow"></div>
          <div className="portal-content">
            <MessageCircle className="portal-icon" size={48} />
            <h2>Login to Access Live Support</h2>
            <p>
              Experience real-time support with our premium live chat system. Connect with our team instantly.
            </p>

            <div className="portal-features">
              <div className="portal-feature">
                <span className="check">✓</span>
                <span>Secure End-to-End Encrypted</span>
              </div>
              <div className="portal-feature">
                <span className="check">✓</span>
                <span>AI + Human Support</span>
              </div>
              <div className="portal-feature">
                <span className="check">✓</span>
                <span>Average 2-min Response</span>
              </div>
            </div>

            <button className="btn-primary-large" onClick={() => setShowSupport(true)}>
              Open Live Support
            </button>

            <p className="portal-hint">📝 Login required to start a conversation</p>
          </div>
        </motion.div>
      </section>

      {/* Support Modal */}
      <SupportModal isOpen={showSupport} onClose={() => setShowSupport(false)} />

      {/* ========== FAQ SECTION ========== */}
      <section className="faq-section">
        <motion.h2 variants={itemVariants} initial="hidden" whileInView="visible" className="section-title">
          Frequently Asked Questions
        </motion.h2>

        <motion.div
          className="faq-container"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className={`faq-item ${expandedFaq === i ? 'expanded' : ''}`}
            >
              <button
                className="faq-header"
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
              >
                <span>{faq.question}</span>
                {expandedFaq === i ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </button>
              <motion.div
                className="faq-answer"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: expandedFaq === i ? 'auto' : 0, opacity: expandedFaq === i ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <p>{faq.answer}</p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ========== FOOTER CTA ========== */}
      <section className="footer-cta-section">
        <div className="cta-glow"></div>

        <motion.div
          className="cta-content"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2>Still Need Help?</h2>
          <p>Our support team is ready to assist you right now.</p>
          <button className="btn-primary-glow" onClick={() => setShowSupport(true)}>
            <Headphones size={20} /> Connect With Support
          </button>
        </motion.div>
      </section>
    </div>
  );
};

export default Contact;

