/**
 * Safe Property Access Utilities
 * Prevents "Cannot read properties of undefined" errors
 */

/**
 * Safely get nested object property with fallback
 * @param {object} obj - Object to access
 * @param {string} path - Path like "user.profile.name"
 * @param {*} defaultValue - Fallback value
 * @returns {*} - Property value or defaultValue
 */
export const safeGet = (obj, path, defaultValue = undefined) => {
  try {
    if (!obj || typeof obj !== 'object') {
      return defaultValue;
    }
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined || value === null) {
        return defaultValue;
      }
    }
    return value ?? defaultValue;
  } catch {
    return defaultValue;
  }
};

/**
 * Safely parse JSON with fallback
 * @param {string} json - JSON string
 * @param {*} defaultValue - Fallback value
 * @returns {*} - Parsed object or defaultValue
 */
export const safeParse = (json, defaultValue = null) => {
  try {
    return JSON.parse(json);
  } catch {
    console.warn('Failed to parse JSON:', json);
    return defaultValue;
  }
};

/**
 * Safely stringify value with fallback
 * @param {*} value - Value to stringify
 * @param {string} defaultValue - Fallback string
 * @returns {string} - JSON string or defaultValue
 */
export const safeStringify = (value, defaultValue = '{}') => {
  try {
    return JSON.stringify(value);
  } catch {
    console.warn('Failed to stringify value:', value);
    return defaultValue;
  }
};

/**
 * Safely access array element with validation
 * @param {Array} arr - Array to access
 * @param {number} index - Array index
 * @param {*} defaultValue - Fallback value
 * @returns {*} - Element or defaultValue
 */
export const safeArrayGet = (arr, index, defaultValue = undefined) => {
  if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
    return defaultValue;
  }
  return arr[index] ?? defaultValue;
};

/**
 * Ensure value is array, return empty array if not
 * @param {*} value - Value to validate
 * @returns {Array} - Array or empty array
 */
export const ensureArray = (value) => {
  return Array.isArray(value) ? value : [];
};

/**
 * Ensure value is object, return empty object if not
 * @param {*} value - Value to validate
 * @returns {object} - Object or empty object
 */
export const ensureObject = (value) => {
  return typeof value === 'object' && value !== null ? value : {};
};

/**
 * Sanitize API response to prevent crashes
 * @param {*} response - API response
 * @returns {object} - Sanitized response
 */
export const sanitizeApiResponse = (response) => {
  const defaultResponse = { success: false, data: null, error: null };
  
  if (!response || typeof response !== 'object') {
    return defaultResponse;
  }

  return {
    success: response?.success ?? false,
    data: response?.data ?? null,
    error: response?.error ?? null,
    message: response?.message ?? '',
    statusCode: response?.statusCode ?? 500
  };
};

/**
 * Format API error message safely
 * @param {Error|object} error - Error object
 * @returns {string} - Formatted error message
 */
export const formatErrorMessage = (error) => {
  if (!error) {
    return 'An unknown error occurred';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message) {
    return error.message;
  }

  return 'An unknown error occurred';
};

/**
 * Create safe fetch interceptor
 * @param {object} options - Fetch options
 * @returns {object} - Safe options with error handling
 */
export const createSafeFetch = (options = {}) => {
  return {
    headers: options?.headers ?? { 'Content-Type': 'application/json' },
    timeout: options?.timeout ?? 10000,
    ...options
  };
};

export default {
  safeGet,
  safeParse,
  safeStringify,
  safeArrayGet,
  ensureArray,
  ensureObject,
  sanitizeApiResponse,
  formatErrorMessage,
  createSafeFetch
};
