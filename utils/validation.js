// Validate email format
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate phone format
export const validatePhone = (phone) => {
  // Indian format: 10 digits
  const re = /^[0-9]{10}$/;
  return re.test(phone?.replace(/[-\s]/g, ''));
};

// Validate password strength
export const validatePassword = (password) => {
  // At least 8 characters, with uppercase, lowercase, and digit
  if (!password || password.length < 8) {
    return false;
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  
  return hasUpperCase && hasLowerCase && hasDigit;
};

// Normalize enum fields to lowercase (gender, role, status, etc.)
export const normalizeEnumFields = (userData) => {
  if (!userData) return userData;
  
  const normalized = { ...userData };
  
  // Normalize gender
  if (normalized.gender) {
    normalized.gender = normalized.gender.toLowerCase();
    // Validate against allowed values
    const validGenders = ['male', 'female', 'other'];
    if (!validGenders.includes(normalized.gender)) {
      throw new Error(`Invalid gender value. Allowed: ${validGenders.join(', ')}`);
    }
  }
  
  // Normalize role
  if (normalized.role) {
    normalized.role = normalized.role.toLowerCase();
    const validRoles = ['user', 'admin', 'super_admin', 'moderator', 'finance_admin', 'support_admin', 'analyst'];
    if (!validRoles.includes(normalized.role)) {
      throw new Error(`Invalid role value. Allowed: ${validRoles.join(', ')}`);
    }
  }
  
  // Normalize status
  if (normalized.status) {
    normalized.status = normalized.status.toLowerCase();
    const validStatuses = ['active', 'banned', 'pending', 'rejected'];
    if (!validStatuses.includes(normalized.status)) {
      throw new Error(`Invalid status value. Allowed: ${validStatuses.join(', ')}`);
    }
  }
  
  // Normalize subscription_status
  if (normalized.subscription_status) {
    normalized.subscription_status = normalized.subscription_status.toLowerCase();
    const validSubStatuses = ['none', 'pending', 'approved', 'rejected', 'active', 'expired'];
    if (!validSubStatuses.includes(normalized.subscription_status)) {
      throw new Error(`Invalid subscription_status value. Allowed: ${validSubStatuses.join(', ')}`);
    }
  }
  
  return normalized;
};

// Check duplicate user
export const checkDuplicateUser = async (User, userData) => {
  const duplicates = [];
  
  // Check email
  if (userData.email) {
    const emailExists = await User.findOne({ email: userData.email.toLowerCase() });
    if (emailExists) duplicates.push('email');
  }
  
  // Check college email
  if (userData.collegeEmail) {
    const collegeEmailExists = await User.findOne({ collegeEmail: userData.collegeEmail.toLowerCase() });
    if (collegeEmailExists) duplicates.push('collegeEmail');
  }
  
  // Check personal email
  if (userData.personalEmail) {
    const personalEmailExists = await User.findOne({ personalEmail: userData.personalEmail.toLowerCase() });
    if (personalEmailExists) duplicates.push('personalEmail');
  }
  
  // Check phone
  if (userData.phone) {
    const phoneExists = await User.findOne({ phone: userData.phone });
    if (phoneExists) duplicates.push('phone');
  }
  
  return duplicates;
};

// Check duplicate payment
export const checkDuplicatePayment = async (Subscription, paymentId) => {
  const exists = await Subscription.findOne({ payment_id: paymentId });
  return !!exists;
};

// Sanitize user object (remove sensitive data)
export const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  delete userObj.livePhoto; // Don't send large base64 in list
  delete userObj.idCard; // Don't send large base64 in list
  return userObj;
};

// Format error response
export const errorResponse = (message, details = null) => {
  return {
    success: false,
    message,
    details: details || undefined
  };
};

// Format success response
export const successResponse = (message, data = null) => {
  return {
    success: true,
    message,
    data: data || undefined
  };
};

export default {
  validateEmail,
  validatePhone,
  validatePassword,
  normalizeEnumFields,
  checkDuplicateUser,
  checkDuplicatePayment,
  sanitizeUser,
  errorResponse,
  successResponse
};
