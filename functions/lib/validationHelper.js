/**
 * Validation and sanitization helpers
 */

export class ValidationHelper {
  /**
   * Validate email
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number (basic)
   */
  static isValidPhone(phone) {
    const phoneRegex = /^[\d\s()+-]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  /**
   * Validate password strength
   */
  static isValidPassword(password) {
    // At least 6 characters (can be stricter in production)
    return password && password.length >= 6;
  }

  /**
   * Sanitize string input
   */
  static sanitize(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Validate required fields
   */
  static validateRequired(obj, fields) {
    const missing = fields.filter(field => !obj[field]);
    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Validate ObjectId format (MongoDB)
   */
  static isValidObjectId(id) {
    return /^[a-f\d]{24}$/i.test(id);
  }

  /**
   * Validate UPI ID
   */
  static isValidUPI(upi) {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/;
    return upiRegex.test(upi);
  }

  /**
   * Parse and validate JSON
   */
  static tryParseJSON(str) {
    try {
      return { success: true, data: JSON.parse(str) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default ValidationHelper;
