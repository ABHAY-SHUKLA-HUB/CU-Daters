import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiBaseUrl';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [step, setStep] = useState(1); // 1=Basic, 2=OTP, 3=Profile, 4=Photos
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorModal, setErrorModal] = useState(null); // For OTP limit modal
  const [otpRequestsRemaining, setOtpRequestsRemaining] = useState(5); // Track remaining attempts
  const [formData, setFormData] = useState({
    name: '',
    personalEmail: '',
    phone: '',
    password: '',
    confirmPassword: '',
    college: '', // NEW - College selection
    otp: '', // NEW - For OTP verification
    gender: '',
    course: '',
    year: '',
    bio: '',
    livePhoto: '',
    idCard: '',
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const API_URL = getApiBaseUrl();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [idCardPreview, setIdCardPreview] = useState('');

  const COLLEGES = [
    'Chandigarh University Mohali',
    'Chandigarh University UP'
  ];

  // Camera functions
  const startCamera = async () => {
    setCameraActive(true);
    setPhotoTaken(false);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        alert('Camera access denied or not available.');
      }
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, 320, 240);
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setFormData(prev => ({ ...prev, livePhoto: dataUrl }));
      setPhotoTaken(true);
      const stream = videoRef.current.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setCameraActive(false);
    }
  };

  const retakePhoto = () => {
    setFormData(prev => ({ ...prev, livePhoto: '' }));
    setPhotoTaken(false);
    startCamera();
  };

  const handleIdCardChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, idCard: reader.result }));
        setIdCardPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    return /^\d{10}$/.test(phone);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.personalEmail || !validateEmail(formData.personalEmail)) {
      newErrors.personalEmail = 'Valid email is required';
    }
    if (!formData.phone || !validatePhone(formData.phone)) {
      newErrors.phone = 'Valid 10-digit phone number required';
    }
    if (!formData.password || !validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.college) {
      newErrors.college = 'College selection is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!formData.gender) newErrors.gender = 'Please select gender';
    if (!formData.course) newErrors.course = 'Please select course';
    if (!formData.year) newErrors.year = 'Please select year';
    if (formData.bio.length < 20) {
      newErrors.bio = 'Bio must be at least 20 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Send OTP
  const handleSendOtp = async () => {
    // Validate Step 1
    if (!validateStep1()) {
      return;
    }

    setLoading(true);
    setError('');
    setErrorModal(null);

    try {
      const response = await axios.post(`${API_URL}/api/auth/send-otp`, {
        name: formData.name.trim(),
        email: formData.personalEmail.toLowerCase().trim(),
        phone: formData.phone,
        password: formData.password,
        college: formData.college
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 45000
      });

      // If success, move to Step 2
      if (response.data?.success) {
        // Check if email failed but OTP still generated
        if (response.data?.data?.emailStatus === 'failed' && response.data?.data?.otp) {
          const otpCode = response.data.data.otp;
          
          // Store OTP for display in UI
          setFormData(prev => ({ ...prev, fallbackOtp: otpCode }));
          setErrorModal({
            title: '📧 Email Not Received',
            message: `Your OTP is: ${otpCode}\n\nEmail delivery failed. Use this code to continue.\nValid for 5 minutes.`,
            type: 'info',
            onClose: () => {
              setErrorModal(null);
              // After user closes modal, proceed to Step 2
              setStep(2);
            }
          });
        } else {
          // Email sent successfully, move to Step 2
          setStep(2);
        }
      } else {
        throw new Error(response.data?.message || 'Server returned success=false');
      }
    } catch (err) {
      let errorMsg = 'Failed to send OTP. Please try again.';
      
      if (err.response?.status === 429) {
        errorMsg = err.response.data?.message || 'You have reached your OTP limit. Please try again after 20 minutes.';
        setErrorModal({
          title: '⏱️ OTP Request Limit Reached',
          message: errorMsg,
          type: 'limit',
          isRateLimit: true
        });
      } else if (err.response?.status === 409) {
        errorMsg = 'Email already registered. Please login instead.';
        setError(errorMsg);
      } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        errorMsg = '❌ Cannot connect to server. Backend might be down.';
        setError(errorMsg);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setErrors({ otp: 'Please enter a valid 6-digit OTP' });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/auth/verify-otp`, {
        email: formData.personalEmail.toLowerCase().trim(),
        otp: formData.otp
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 45000
      });

      if (response.data.success) {
        setStep(3);
      }
    } catch (err) {
      let errorMsg = 'Invalid or expired OTP. Please try again.';
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Next step navigation
  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      handleSendOtp();
    } else if (step === 3 && validateStep3()) {
      setStep(4);
    }
  };

  // Complete profile and submit photos
  const handleSubmit = async () => {
    if (step === 4) {
      const newErrors = {};
      if (!formData.livePhoto) newErrors.livePhoto = 'Live photo required';
      if (!formData.idCard) newErrors.idCard = 'ID card image required';
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/auth/signup`, {
        email: formData.personalEmail.toLowerCase().trim(),
        gender: formData.gender,
        course: formData.course,
        year: formData.year,
        bio: formData.bio,
        livePhoto: formData.livePhoto,
        idCard: formData.idCard
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 90000
      });

      if (response.data.success || response.status === 201) {
        const resolvedToken = response.data.data?.token || response.data.data?.authToken || '';
        const userData = response.data.data?.user || response.data.user;
        if (userData && resolvedToken) {
          setAuth({ token: resolvedToken, user: userData });
        }

        setTimeout(() => {
          navigate('/pending-approval');
        }, 500);
      }
    } catch (err) {
      let errorMsg = 'Registration failed. Please try again.';

      if (err.code === 'ECONNABORTED') {
        errorMsg = '⏳ Server is slow (Render free tier waking up). Please wait 60 seconds and try again.';
      } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        errorMsg = 'Cannot connect to server. Backend might be down.';
      } else if (err.response?.status === 413) {
        errorMsg = 'File size too large. Please use smaller images.';
      } else if (err.response?.status === 400) {
        errorMsg = err.response.data?.message || 'Validation error. Check all fields.';
      } else if (err.response?.status === 404) {
        errorMsg = err.response.data?.message || 'User not found. Please complete email verification.';
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-creamyWhite via-warmCream to-softPink px-4 pt-24 pb-12">
      <div className="max-w-2xl mx-auto">
        {/* OTP Limit/Info Modal */}
        {errorModal && (errorModal.isRateLimit || errorModal.type === 'info') && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-bounce-in">
              {/* Header with gradient */}
              <div className={`px-6 py-8 text-center ${errorModal.type === 'info' ? 'bg-gradient-to-r from-blue-400 to-cyan-400' : 'bg-gradient-to-r from-blushPink to-softPink'}`}>
                <div className="text-6xl mb-3">{errorModal.type === 'info' ? '📧' : '⏱️'}</div>
                <h2 className="text-2xl font-bold text-white">{errorModal.title}</h2>
              </div>
              
              {/* Content */}
              <div className="px-6 py-8 text-center">
                <p className="text-lg text-darkBrown font-semibold mb-4 whitespace-pre-wrap">
                  {errorModal.message}
                </p>
                
                {errorModal.isRateLimit && (
                  <>
                    {/* Security Note */}
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl px-4 py-4 mb-6">
                      <p className="text-sm text-amber-800">
                        🔒 <strong>Security Note:</strong> This limit protects your account from unauthorized attempts.
                      </p>
                    </div>

                    {/* Tips */}
                    <div className="bg-blue-50 rounded-xl px-4 py-3 mb-6">
                      <p className="text-xs text-blue-800">
                        💡 <strong>Tip:</strong> While you wait, check your email for the OTP or prepare your other registration details.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-6 border-t-2 border-softPink">
                <button
                  onClick={() => {
                    if (errorModal.onClose) {
                      errorModal.onClose();
                    } else {
                      setErrorModal(null);
                    }
                  }}
                  className="w-full bg-gradient-to-r from-blushPink to-softPink hover:from-darkBrown hover:to-blushPink text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105"
                >
                  {errorModal.type === 'info' ? '✓ Got It, Continue' : '✓ Understand'}
                </button>
                {errorModal.isRateLimit && (
                  <p className="text-xs text-softBrown mt-4 text-center">
                    You can try again after 20 minutes
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="text-center mb-8">
            <div className="text-5xl mb-2">💕</div>
            <h1 className="text-3xl font-bold gradient-text mb-2">CU Daters</h1>
            <p className="text-softBrown">Create Your Account</p>
          </div>

          {/* Progress Bar - 4 Steps */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full transition ${
                  s <= step ? 'bg-blushPink' : 'bg-softPink'
                }`}
              ></div>
            ))}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="text-center mb-6">
            <p className="text-softBrown">
              Step {step} of 4: {
                step === 1 ? 'Account Details' : 
                step === 2 ? 'Email Verification' : 
                step === 3 ? 'Profile Info' : 
                'Photo Upload'
              }
            </p>
          </div>

          {/* Step 1: Account Details + College */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-left text-darkBrown font-bold mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                  className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-white text-black font-semibold"
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-left text-darkBrown font-bold mb-2">Email Address *</label>
                <input
                  type="email"
                  name="personalEmail"
                  value={formData.personalEmail}
                  onChange={handleInputChange}
                  placeholder="your.email@gmail.com"
                  className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-white text-black font-semibold"
                />
                {errors.personalEmail && <p className="text-red-600 text-sm mt-1">{errors.personalEmail}</p>}
              </div>

              <div>
                <label className="block text-left text-darkBrown font-bold mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="10-digit mobile number"
                  maxLength="10"
                  className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-white text-black font-semibold"
                />
                {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-left text-darkBrown font-bold mb-2">🏫 College *</label>
                <select
                  name="college"
                  value={formData.college}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-white text-black font-semibold"
                >
                  <option value="">Select your college</option>
                  {COLLEGES.map((college) => (
                    <option key={college} value={college}>
                      {college}
                    </option>
                  ))}
                </select>
                {errors.college && <p className="text-red-600 text-sm mt-1">{errors.college}</p>}
              </div>

              <div>
                <label className="block text-left text-darkBrown font-bold mb-2">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-white text-black font-semibold"
                />
                {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-left text-darkBrown font-bold mb-2">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-white text-black font-semibold"
                />
                {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? '⏳ Sending OTP...' : '📧 Send OTP to Email'}
              </button>

              <p className="text-center text-sm text-softBrown">
                Already have an account? <Link to="/login" className="text-blushPink font-bold hover:underline">Login here</Link>
              </p>
            </div>
          )}

          {/* Step 2: Email OTP Verification */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p className="text-softBrown mb-4 text-sm text-center">
                  📧 We sent a 6-digit code to<br />
                  <strong>{formData.personalEmail}</strong>
                </p>
              </div>

              <div>
                <label className="block text-left text-darkBrown font-bold mb-2">Enter OTP Code *</label>
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleInputChange}
                  onlyNumbers
                  placeholder="000000"
                  maxLength="6"
                  className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-white text-black font-semibold text-center text-2xl tracking-widest"
                />
                {errors.otp && <p className="text-red-600 text-sm mt-1">{errors.otp}</p>}
                <p className="text-xs text-softBrown mt-2 text-center">Valid for 5 minutes</p>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? '🔄 Verifying...' : '✓ Verify OTP'}
              </button>



              <button
                onClick={() => {
                  setStep(1);
                  setFormData(prev => ({ ...prev, otp: '' }));
                }}
                className="btn-secondary w-full"
              >
                ← Back to Email
              </button>
            </div>
          )}

          {/* Step 3: Profile Info */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-left text-darkBrown font-bold mb-2">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-white text-black font-semibold"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="text-red-600 text-sm mt-1">{errors.gender}</p>}
              </div>

              <div>
                <label className="block text-left text-darkBrown font-bold mb-2">Course *</label>
                <input
                  type="text"
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                  placeholder="e.g., B.Tech, B.Com, BBA"
                  className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-white text-black font-semibold"
                />
                {errors.course && <p className="text-red-600 text-sm mt-1">{errors.course}</p>}
              </div>

              <div>
                <label className="block text-left text-darkBrown font-bold mb-2">Year *</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-white text-black font-semibold"
                >
                  <option value="">Select year</option>
                  <option value="1st">1st Year</option>
                  <option value="2nd">2nd Year</option>
                  <option value="3rd">3rd Year</option>
                  <option value="4th">4th Year</option>
                </select>
                {errors.year && <p className="text-red-600 text-sm mt-1">{errors.year}</p>}
              </div>

              <div>
                <label className="block text-left text-darkBrown font-bold mb-2">Bio (Minimum 20 chars) *</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                  rows="4"
                  className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-white text-black font-semibold"
                />
                <p className="text-xs text-softBrown mt-1">{formData.bio.length}/100 characters</p>
                {errors.bio && <p className="text-red-600 text-sm mt-1">{errors.bio}</p>}
              </div>

              <button
                onClick={handleNext}
                className="btn-primary w-full"
              >
                Next: Upload Photos →
              </button>
            </div>
          )}

          {/* Step 4: Photo Upload */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-left text-darkBrown font-bold mb-2">📸 Live Photo *</label>
                {!photoTaken ? (
                  <div>
                    {!cameraActive ? (
                      <button
                        onClick={startCamera}
                        className="btn-primary w-full"
                      >
                        📷 Start Camera
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full bg-black rounded-lg"
                        />
                        <button
                          onClick={takePhoto}
                          className="btn-primary w-full"
                        >
                          📸 Take Photo
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <img
                      src={formData.livePhoto}
                      alt="Live"
                      className="w-full rounded-lg"
                    />
                    <button
                      onClick={retakePhoto}
                      className="btn-secondary w-full"
                    >
                      🔄 Retake Photo
                    </button>
                  </div>
                )}
                {errors.livePhoto && <p className="text-red-600 text-sm mt-1">{errors.livePhoto}</p>}
              </div>

              <div>
                <label className="block text-left text-darkBrown font-bold mb-2">🆔 ID Card (Upload Image) *</label>
                {!idCardPreview ? (
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIdCardChange}
                      className="hidden"
                    />
                    <div className="w-full px-4 py-8 border-2 border-dashed border-softPink rounded-lg text-center hover:border-blushPink bg-creamyWhite transition">
                      <p className="text-softBrown">📤 Click to upload ID card</p>
                    </div>
                  </label>
                ) : (
                  <div className="space-y-2">
                    <img
                      src={idCardPreview}
                      alt="ID Card"
                      className="w-full rounded-lg"
                    />
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleIdCardChange}
                        className="hidden"
                      />
                      <div className="w-full px-4 py-2 border-2 border-softPink rounded-lg text-center hover:border-blushPink bg-creamyWhite text-softBrown text-sm transition">
                        📤 Change ID Card
                      </div>
                    </label>
                  </div>
                )}
                {errors.idCard && <p className="text-red-600 text-sm mt-1">{errors.idCard}</p>}
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? '⏳ Creating Account...' : '✓ Complete Registration'}
              </button>

              <button
                onClick={() => setStep(3)}
                className="btn-secondary w-full"
              >
                ← Back
              </button>
            </div>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" width={320} height={240} />
    </div>
  );
}
