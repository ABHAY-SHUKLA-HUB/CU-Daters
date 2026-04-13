import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authApi from '../services/authApi';
import api from '../services/api';
import { getApiBaseUrl } from '../utils/apiBaseUrl';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [step, setStep] = useState(1); // 1=Account Details + T&C, 2=Profile + Photos, 3=Pending Approval
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    college: '',
    termsAccepted: false,
    gender: '',
    fieldOfWork: '',
    experienceYears: '',
    bio: '',
    livePhoto: '',
    idCard: '',
    idProofType: 'government_id',
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const API_URL = getApiBaseUrl();
  const AUTH_API_BASE = API_URL.endsWith('/api') ? `${API_URL}/auth` : `${API_URL}/api/auth`;

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [idCardPreview, setIdCardPreview] = useState('');
  const [idUploading, setIdUploading] = useState(false);
  const [fieldSuggestions, setFieldSuggestions] = useState([]);

  const COLLEGES = [
    'Independent / Not Listed',
    'Local Community',
    'Working Professional',
    'Creator / Freelancer',
    'Other Network'
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
      setIdUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, idCard: reader.result }));
        setIdCardPreview(reader.result);
        setIdUploading(false);
      };
      reader.onerror = () => {
        setIdUploading(false);
        setError('Unable to read ID file. Please try another image.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;
    if (name === 'experienceYears') {
      nextValue = value.split('').filter(ch => ch >= '0' && ch <= '9').join('').slice(0, 2);
    }
    setFormData(prev => ({ ...prev, [name]: nextValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  useEffect(() => {
    const query = formData.fieldOfWork.trim();
    if (!query) {
      setFieldSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const response = await api.get('/api/auth/onboarding/field-suggestions', {
          params: { q: query },
          signal: controller.signal,
          timeout: 10000
        });
        const suggestions = response?.data?.suggestions || [];
        setFieldSuggestions(Array.isArray(suggestions) ? suggestions : []);
      } catch {
        setFieldSuggestions([]);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [AUTH_API_BASE, formData.fieldOfWork]);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    return /^\d{10}$/.test(phone);
  };

  const validatePassword = (password) => {
    // Must be at least 8 characters with uppercase, lowercase, and digit
    if (password.length < 8) return false;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    return hasUpperCase && hasLowerCase && hasDigit;
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email || !validateEmail(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!formData.phone || !validatePhone(formData.phone)) {
      newErrors.phone = 'Valid 10-digit phone number required';
    }
    if (!formData.password || !validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.college) {
      newErrors.college = 'Community or organization is required';
    }
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the Terms & Conditions';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Next step navigation (validate Step 1)
  const handleNextToPhotos = async () => {
    if (!validateStep1()) return;
    
    setLoading(true);
    setError('');
    try {
      // Just move to step 2, no OTP needed
      setStep(2);
    } finally {
      setLoading(false);
    }
  };


  // Complete profile and submit photos (now includes account details)
  const handleSubmit = async () => {
    if (step === 2) {
      // Validate step 2
      const newErrors = {};
      if (!formData.gender) newErrors.gender = 'Gender required';
      if (!formData.fieldOfWork) newErrors.fieldOfWork = 'Field of work required';
      if (!formData.experienceYears || Number.isNaN(Number(formData.experienceYears))) newErrors.experienceYears = 'Experience must be a number';
      if (!formData.bio || formData.bio.length < 20) newErrors.bio = 'Bio must be at least 20 characters';
      if (!formData.livePhoto) newErrors.livePhoto = 'Live photo required';
      if (!formData.idCard) newErrors.idCard = 'ID card image required';
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('[SIGNUP] Submitting form with data:', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        college: formData.college,
        gender: formData.gender,
        fieldOfWork: formData.fieldOfWork,
        experienceYears: formData.experienceYears,
        bioLength: formData.bio?.length,
        hasLivePhoto: !!formData.livePhoto,
        hasIdCard: !!formData.idCard,
        livePhotoSize: formData.livePhoto?.length,
        idCardSize: formData.idCard?.length
      });

      const response = await authApi.signup({
        // Account details
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone,
        password: formData.password,
        college: formData.college,
        // Profile details
        gender: formData.gender,
        fieldOfWork: formData.fieldOfWork,
        experienceYears: Number(formData.experienceYears),
        bio: formData.bio,
        // Photos
        liveSelfie: formData.livePhoto,
        idProofFile: formData.idCard,
        idProofType: formData.idProofType
      });

      console.log('[SIGNUP] Response:', response);

      if (response.success || response.status === 201) {
        const resolvedToken = response.data?.data?.token || response.data?.data?.authToken || '';
        const userData = response.data?.data?.user || response.data?.user;
        if (userData && resolvedToken) {
          setAuth({ token: resolvedToken, user: userData });
        }

        // Move to pending approval step
        setStep(3);
      }
    } catch (err) {
      console.error('[SIGNUP] Error:', err);

      let errorMsg = 'Registration failed. Please try again.';

      if (err.code === 'ECONNABORTED') {
        errorMsg = '⏳ Server is slow. Please wait 60 seconds and try again.';
      } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        errorMsg = 'Cannot connect to server. Backend might be down.';
      } else if (err.response?.status === 413) {
        errorMsg = 'File size too large. Please use smaller images.';
      } else if (err.response?.status === 400) {
        errorMsg = err.response.data?.message || 'Validation error. Check all fields.';
      } else if (err.response?.status === 409) {
        errorMsg = err.response.data?.message || 'Phone or email already registered.';
      } else if (err.response?.status === 500) {
        errorMsg = err.response.data?.message || 'Server error. Please try again.';
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = `Error: ${err.message}`;
      }

      console.error('[SIGNUP] Final error message:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-creamyWhite via-warmCream to-softPink px-4 pt-24 pb-12">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="text-center mb-8">
            <div className="text-5xl mb-2">💕</div>
            <h1 className="text-3xl font-bold gradient-text mb-2">SeeU-Daters</h1>
            <p className="text-softBrown">Create Your Account</p>
          </div>

          {/* Progress Bar - 3 Steps */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((s) => (
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
              Step {step} of 3: {
                step === 1 ? 'Account Details & Terms' : 
                step === 2 ? 'Profile & Photos' : 
                'Pending Approval'
              }
            </p>
          </div>

          {/* Step 1: Account Details + Community + Terms & Conditions */}
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
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@gmail.com"
                  className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-white text-black font-semibold"
                />
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
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
                <label className="block text-left text-darkBrown font-bold mb-2">🌍 Community / Organization *</label>
                <select
                  name="college"
                  value={formData.college}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-white text-black font-semibold"
                >
                  <option value="">Select your community or organization</option>
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
                  placeholder="At least 8 characters with uppercase, lowercase, and number"
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

              {/* Terms & Conditions Checkbox */}
              <div className="flex items-start gap-3 p-4 bg-softPink rounded-lg">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }));
                    if (errors.termsAccepted) {
                      setErrors(prev => ({ ...prev, termsAccepted: '' }));
                    }
                  }}
                  className="w-5 h-5 mt-1 cursor-pointer"
                />
                <div>
                  <label className="text-darkBrown font-bold cursor-pointer">
                    I agree to the Terms & Conditions
                  </label>
                  <p className="text-sm text-softBrown mt-1">
                    I have read and accept the{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blushPink font-bold hover:underline">
                      Terms & Conditions
                    </a>
                  </p>
                </div>
              </div>
              {errors.termsAccepted && <p className="text-red-600 text-sm mt-1">{errors.termsAccepted}</p>}

              <button
                onClick={handleNextToPhotos}
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? '⏳ Loading...' : 'Next: Profile & Photos →'}
              </button>

              <p className="text-center text-sm text-softBrown">
                Already have an account? <Link to="/login" className="text-blushPink font-bold hover:underline">Login here</Link>
              </p>
            </div>
          )}

          {/* Step 2: Profile Info + Photo Upload */}
          {step === 2 && (
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
                <label className="block text-left text-darkBrown font-bold mb-2">Branch / Field of Work *</label>
                <input
                  type="text"
                  name="fieldOfWork"
                  value={formData.fieldOfWork}
                  onChange={handleInputChange}
                  placeholder="e.g., Software Engineering, Marketing, Design"
                  list="field-suggestions"
                  className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-white text-black font-semibold"
                />
                <datalist id="field-suggestions">
                  {fieldSuggestions.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
                {errors.fieldOfWork && <p className="text-red-600 text-sm mt-1">{errors.fieldOfWork}</p>}
              </div>

              <div>
                <label className="block text-left text-darkBrown font-bold mb-2">Experience / Year *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleInputChange}
                  placeholder="Enter numeric value (1-40)"
                  className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-white text-black font-semibold"
                />
                {errors.experienceYears && <p className="text-red-600 text-sm mt-1">{errors.experienceYears}</p>}
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
                <label className="block text-left text-darkBrown font-bold mb-2">ID Proof Type *</label>
                <select
                  name="idProofType"
                  value={formData.idProofType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-white text-black font-semibold"
                >
                  <option value="government_id">Government ID</option>
                  <option value="student_id">Student ID</option>
                  <option value="employee_id">Employee ID</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-left text-darkBrown font-bold mb-2">🆔 ID Proof (Upload Image/PDF) *</label>
                {!idCardPreview ? (
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
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
                        accept="image/*,application/pdf"
                        onChange={handleIdCardChange}
                        className="hidden"
                      />
                      <div className="w-full px-4 py-2 border-2 border-softPink rounded-lg text-center hover:border-blushPink bg-creamyWhite text-softBrown text-sm transition">
                        📤 Change ID Card
                      </div>
                    </label>
                  </div>
                )}
                {idUploading && <p className="text-blue-600 text-sm mt-1">Uploading and preparing secure file...</p>}
                {errors.idCard && <p className="text-red-600 text-sm mt-1">{errors.idCard}</p>}
                <p className="text-xs text-softBrown mt-2">
                  Verification files are encrypted in private storage and only visible to authorized admins.
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? '⏳ Creating Account...' : '✓ Complete Registration'}
              </button>

              <button
                onClick={() => setStep(1)}
                className="btn-secondary w-full"
              >
                ← Back to Account Details
              </button>
            </div>
          )}

          {/* Step 3: Pending Approval Success Screen */}
          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-darkBrown">Registration Successful!</h2>
              <p className="text-softBrown text-lg">
                Your account has been created and is now pending admin approval.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-softBrown">
                  ⏳ <strong>What's Next?</strong><br/>
                  Our team will review your profile and photos. You'll receive an email notification once approved.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-softBrown">
                  📧 We've sent a confirmation email to <strong>{formData.email}</strong>
                </p>
              </div>

              <button
                onClick={() => navigate('/pending-approval')}
                className="btn-primary w-full"
              >
                View Status
              </button>

              <button
                onClick={() => navigate('/login')}
                className="btn-secondary w-full"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" width={320} height={240} />
    </div>
  );
}

