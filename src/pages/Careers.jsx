import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../utils/apiBaseUrl';
import cmsApi from '../services/cmsApi';

export default function Careers() {
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [positions, setPositions] = useState([]);
  const [positionsLoading, setPositionsLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    campus: 'CU Mohali',
    whyYou: '',
    instagram: '',
    linkedin: '',
    experience: ''
  }); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [charCount, setCharCount] = useState(0);

  // Load ambassador positions from CMS
  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      setPositionsLoading(true);
      const response = await cmsApi.getAmbassadorPositions();
      if (response.success && response.data.positions) {
        setPositions(response.data.positions);
      }
    } catch (error) {
      console.error('Failed to load positions:', error);
    } finally {
      setPositionsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'whyYou') {
      setCharCount(value.length);
    }
  };

  const validateForm = () => {
    const { fullName, email, phone, campus, whyYou, instagram, linkedin, experience } = formData;

    if (!fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Valid email is required');
      return false;
    }
    if (!phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!campus) {
      setError('Campus selection is required');
      return false;
    }
    if (!whyYou.trim()) {
      setError('Please tell us why you\'d be a great Campus Ambassador');
      return false;
    }
    if (whyYou.length < 50) {
      setError('Your response must be at least 50 characters');
      return false;
    }
    if (whyYou.length > 2000) {
      setError('Your response cannot exceed 2000 characters');
      return false;
    }
    if (!instagram.trim()) {
      setError('Instagram handle is required');
      return false;
    }
    if (!linkedin.trim()) {
      setError('LinkedIn profile is required');
      return false;
    }
    if (!/^https?:\/\/.+/i.test(linkedin)) {
      setError('LinkedIn profile must be a valid URL');
      return false;
    }
    if (!experience.trim()) {
      setError('Past event/marketing experience is required');
      return false;
    }
    if (experience.length < 20) {
      setError('Please provide at least 20 characters of experience details');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/admin/career-applications/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit application');
      }

      setSuccess(true);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        campus: 'CU Mohali',
        whyYou: '',
        instagram: '',
        linkedin: '',
        experience: ''
      });
      setCharCount(0);

      // Auto-close form after 3 seconds
      setTimeout(() => {
        setShowApplicationForm(false);
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20 pb-20">
      <section className="bg-gradient-to-br from-creamyWhite to-warmCream py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-black text-darkBrown mb-4">
              🚀 Become a Campus Ambassador
            </h1>
            <p className="text-xl text-softBrown">
              Be the face of CU DATERS on your campus. Help us build a trusted, safe dating community for college students while gaining valuable experience, rewards, and recognition.
            </p>
          </div>

          {/* Why Join Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <div className="bg-white rounded-2xl p-8 border-2 border-softPink">
              <h2 className="text-2xl font-bold text-darkBrown mb-6 flex items-center gap-2">
                <span>✨</span> Why Become a Campus Ambassador?
              </h2>
              <ul className="space-y-4 text-softBrown">
                <li className="flex items-start gap-3">
                  <span className="text-blushPink font-bold text-xl flex-shrink-0">✓</span>
                  <span><strong className="text-darkBrown block">Exclusive Early Access</strong> Get first dibs on new features</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blushPink font-bold text-xl flex-shrink-0">✓</span>
                  <span><strong className="text-darkBrown block">Free Premium Membership</strong> Unlock all premium features</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blushPink font-bold text-xl flex-shrink-0">✓</span>
                  <span><strong className="text-darkBrown block">Official Certificate</strong> Credential for your resume</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blushPink font-bold text-xl flex-shrink-0">✓</span>
                  <span><strong className="text-darkBrown block">Letter of Recommendation</strong> From our founders</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blushPink font-bold text-xl flex-shrink-0">✓</span>
                  <span><strong className="text-darkBrown block">Branded Merchandise</strong> CU DATERS swag & goodies</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blushPink font-bold text-xl flex-shrink-0">✓</span>
                  <span><strong className="text-darkBrown block">Founder Networking</strong> Direct access to leadership</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blushPink font-bold text-xl flex-shrink-0">✓</span>
                  <span><strong className="text-darkBrown block">Real Leadership Experience</strong> Build your portfolio</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-softPink">
              <h2 className="text-2xl font-bold text-darkBrown mb-6 flex items-center gap-2">
                <span>💼</span> What You'll Do
              </h2>
              <div className="space-y-6 text-softBrown">
                <div>
                  <h3 className="font-bold text-darkBrown mb-2 text-lg">📱 Social Media Promotion</h3>
                  <p className="text-sm">Promote CU DATERS across your campus via Instagram, WhatsApp, and student groups. Share real stories & success from the platform.</p>
                </div>
                <div>
                  <h3 className="font-bold text-darkBrown mb-2 text-lg">🎉 Events & Contests</h3>
                  <p className="text-sm">Organize small campus events, contests, and giveaways to build hype and community engagement.</p>
                </div>
                <div>
                  <h3 className="font-bold text-darkBrown mb-2 text-lg">💬 Collect Feedback</h3>
                  <p className="text-sm">Gather user feedback and feature requests from students to help us improve the platform.</p>
                </div>
                <div>
                  <h3 className="font-bold text-darkBrown mb-2 text-lg">🛡️ Safety Advocate</h3>
                  <p className="text-sm">Act as a trusted contact for students with questions about safety, privacy, and using CU DATERS responsibly.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Open Positions */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-darkBrown mb-8 text-center">💼 Open Positions</h2>
            
            {positionsLoading ? (
              <div className="text-center text-softBrown py-12">Loading positions...</div>
            ) : positions && positions.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {positions.map(position => (
                  <div key={position.id} className="bg-gradient-to-br from-blushPink to-softPink rounded-2xl p-8 text-white border-2 border-blushPink">
                    <h3 className="text-2xl font-bold mb-3">{position.title}</h3>
                    <p className="mb-4 opacity-95">{position.description}</p>
                    <div className="space-y-2 text-sm opacity-90">
                      <p>🎯 <strong>Target Reach:</strong> {position.targetReach}</p>
                      <p>⏱️ <strong>Time Commitment:</strong> {position.timeCommitment}</p>
                      {position.rewards && position.rewards.length > 0 && (
                        <p>🎁 <strong>Rewards:</strong> {position.rewards.join(' + ')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blushPink to-softPink rounded-2xl p-8 text-white border-2 border-blushPink">
                  <h3 className="text-2xl font-bold mb-3">Campus Ambassador – Chandigarh University (Mohali)</h3>
                  <p className="mb-4 opacity-95">Build the dating community at CU Mohali. You'll represent us and connect with students on campus.</p>
                  <div className="space-y-2 text-sm opacity-90">
                    <p>🎯 <strong>Target Reach:</strong> 200–300 students</p>
                    <p>⏱️ <strong>Time Commitment:</strong> 3–5 hours/week</p>
                    <p>🎁 <strong>Rewards:</strong> Free premium access + branded merch + referral incentives</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blushPink to-softPink rounded-2xl p-8 text-white border-2 border-blushPink">
                  <h3 className="text-2xl font-bold mb-3">Campus Ambassador – Chandigarh University (UP)</h3>
                  <p className="mb-4 opacity-95">Build the dating community at CU UP. You'll represent us and connect with students on campus.</p>
                  <div className="space-y-2 text-sm opacity-90">
                    <p>🎯 <strong>Target Reach:</strong> 200–300 students</p>
                    <p>⏱️ <strong>Time Commitment:</strong> 3–5 hours/week</p>
                    <p>🎁 <strong>Rewards:</strong> Free premium access + branded merch + referral incentives</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-2xl p-8 border-2 border-softPink mb-16">
            <h2 className="text-2xl font-bold text-darkBrown mb-6 flex items-center gap-2">
              <span>✅</span> What We're Looking For
            </h2>
            <div className="grid md:grid-cols-2 gap-6 text-softBrown mb-8">
              <div>
                <h3 className="font-bold text-darkBrown mb-2">Must Have:</h3>
                <ul className="space-y-2 text-sm">
                  <li>✓ Currently a student at CU Mohali or CU UP (freshers are welcome!)</li>
                  <li>✓ Active on social media (Instagram, WhatsApp)</li>
                  <li>✓ Passionate about building community</li>
                  <li>✓ Trustworthy and responsible</li>
                  <li>✓ Able to commit 5–8 hours per week</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-darkBrown mb-2">Nice to Have:</h3>
                <ul className="space-y-2 text-sm">
                  <li>✓ Previous event organizing experience</li>
                  <li>✓ Leadership roles in student clubs</li>
                  <li>✓ Strong networking on campus</li>
                  <li>✓ Marketing or social media experience</li>
                  <li>✓ Knowledge of campus dynamics</li>
                </ul>
              </div>
            </div>

            {/* Growth Opportunity Section */}
            <div className="border-t border-softPink pt-6">
              <h3 className="font-bold text-darkBrown mb-3 text-lg">🚀 Growth Opportunity</h3>
              <ul className="space-y-2 text-sm text-softBrown">
                <li>✓ <strong className="text-darkBrown">Freshers are encouraged to apply.</strong> No experience necessary!</li>
                <li>✓ <strong className="text-darkBrown">If you show dedication and excellent performance,</strong> we may offer you a <strong className="text-blushPink">paid position on the platform</strong> as the program grows.</li>
              </ul>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            {!showApplicationForm ? (
              <button
                onClick={() => {
                  setShowApplicationForm(true);
                  setError('');
                  setSuccess(false);
                }}
                className="px-8 py-4 bg-gradient-to-r from-blushPink to-softPink text-white font-bold rounded-full hover:shadow-xl transition transform hover:scale-105"
              >
                Apply Now 🚀
              </button>
            ) : null}
          </div>

          {/* Application Form Modal */}
          {showApplicationForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 max-h-screen overflow-y-auto">
              <div className="bg-white rounded-2xl p-8 max-w-2xl w-full my-8">
                {success ? (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-4">✅</div>
                    <h3 className="text-2xl font-bold text-darkBrown mb-2">Application Submitted!</h3>
                    <p className="text-softBrown">We'll review your application and reach out soon.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-3xl font-bold text-darkBrown">Campus Ambassador Application</h2>
                      <button
                        onClick={() => setShowApplicationForm(false)}
                        className="text-2xl text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-bold text-darkBrown mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blushPink"
                          required
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-bold text-darkBrown mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="your.email@example.com"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blushPink"
                          required
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-bold text-darkBrown mb-2">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+91 98765 43210"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blushPink"
                          required
                        />
                      </div>

                      {/* Campus */}
                      <div>
                        <label className="block text-sm font-bold text-darkBrown mb-2">
                          Campus <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="campus"
                          value={formData.campus}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blushPink"
                          required
                        >
                          {positions && positions.length > 0 ? (
                            positions.map(pos => (
                              <option key={pos.id} value={pos.title}>
                                {pos.title}
                              </option>
                            ))
                          ) : (
                            <>
                              <option value="CU Mohali">Chandigarh University (Mohali)</option>
                              <option value="CU UP">Chandigarh University (UP)</option>
                            </>
                          )}
                        </select>
                      </div>

                      {/* Why You */}
                      <div>
                        <label className="block text-sm font-bold text-darkBrown mb-2">
                          Why would you be a great Campus Ambassador? <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="whyYou"
                          value={formData.whyYou}
                          onChange={handleInputChange}
                          placeholder="Tell us why you're passionate about joining our team... (50-2000 characters)"
                          rows="5"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blushPink resize-none"
                          required
                        />
                        <div className="flex justify-between mt-2">
                          <span className="text-xs text-gray-500">Minimum: 50 characters</span>
                          <span className={`text-xs font-bold ${charCount >= 50 ? 'text-green-600' : 'text-orange-600'}`}>
                            {charCount}/2000
                          </span>
                        </div>
                      </div>

                      {/* Instagram */}
                      <div>
                        <label className="block text-sm font-bold text-darkBrown mb-2">
                          Instagram Handle <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="instagram"
                          value={formData.instagram}
                          onChange={handleInputChange}
                          placeholder="@yourusername"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blushPink"
                          required
                        />
                      </div>

                      {/* LinkedIn */}
                      <div>
                        <label className="block text-sm font-bold text-darkBrown mb-2">
                          LinkedIn Profile <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="url"
                          name="linkedin"
                          value={formData.linkedin}
                          onChange={handleInputChange}
                          placeholder="https://linkedin.com/in/yourprofile"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blushPink"
                          required
                        />
                      </div>

                      {/* Experience */}
                      <div>
                        <label className="block text-sm font-bold text-darkBrown mb-2">
                          Past Event/Marketing Experience <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="experience"
                          value={formData.experience}
                          onChange={handleInputChange}
                          placeholder="Tell us about relevant experience... (clubs, events, campaigns, etc.)"
                          rows="3"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blushPink resize-none"
                          required
                        />
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-4 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowApplicationForm(false)}
                          className="flex-1 px-4 py-2 border border-gray-300 text-darkBrown font-bold rounded-lg hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-blushPink to-softPink text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50"
                        >
                          {loading ? 'Submitting...' : 'Submit Application'}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
