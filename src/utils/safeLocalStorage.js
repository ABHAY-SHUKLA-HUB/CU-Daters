/**
 * Safe localStorage wrapper
 * Handles errors and permissions issues
 */

const safeLocalStorage = (() => {
  let isAvailable = false;

  // Test if localStorage is available
  try {
    const test = '__localStorage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    isAvailable = true;
  } catch {
    isAvailable = false;
  }

  return {
    getItem: (key, defaultValue = null) => {
      if (!isAvailable) {
        return defaultValue;
      }
      try {
        return localStorage.getItem(key) ?? defaultValue;
      } catch (error) {
        console.warn(`Failed to get localStorage["${key}"]`, error);
        return defaultValue;
      }
    },

    setItem: (key, value) => {
      if (!isAvailable) {
        return false;
      }
      try {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn(`Failed to set localStorage["${key}"]`, error);
        return false;
      }
    },

    removeItem: (key) => {
      if (!isAvailable) {
        return false;
      }
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.warn(`Failed to remove localStorage["${key}"]`, error);
        return false;
      }
    },

    clear: () => {
      if (!isAvailable) {
        return false;
      }
      try {
        localStorage.clear();
        return true;
      } catch (error) {
        console.warn('Failed to clear localStorage', error);
        return false;
      }
    },

    isAvailable: () => isAvailable
  };
})();

export default safeLocalStorage;
