/**
 * Request parsing and body handling
 */

export class RequestHelper {
  /**
   * Parse JSON body safely
   */
  static async parseJSON(request) {
    try {
      return await request.json();
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
  }

  /**
   * Get query parameters
   */
  static getQueryParams(request) {
    const url = new URL(request.url);
    return Object.fromEntries(url.searchParams);
  }

  /**
   * Get single query parameter
   */
  static getParam(request, name, defaultValue = null) {
    const url = new URL(request.url);
    return url.searchParams.get(name) || defaultValue;
  }

  /**
   * Parse form data
   */
  static async parseFormData(request) {
    try {
      return await request.formData();
    } catch (error) {
      throw new Error(`Invalid form data: ${error.message}`);
    }
  }

  /**
   * Get request headers as object
   */
  static getHeaders(request) {
    const headers = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }

  /**
   * Extract bearer token from Authorization header
   */
  static getBearerToken(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Get client IP address
   */
  static getClientIP(request) {
    return (
      request.headers.get('CF-Connecting-IP') ||
      request.headers.get('X-Forwarded-For') ||
      'unknown'
    );
  }

  /**
   * Get request metadata
   */
  static getMetadata(request) {
    return {
      method: request.method,
      url: request.url,
      ip: this.getClientIP(request),
      userAgent: request.headers.get('User-Agent'),
      origin: request.headers.get('Origin'),
      timestamp: new Date().toISOString()
    };
  }
}

export default RequestHelper;
