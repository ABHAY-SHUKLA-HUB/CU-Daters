/**
 * Standardized response helpers
 */

export class ResponseHelper {
  static success(data, message = 'Success', statusCode = 200) {
    return new Response(
      JSON.stringify({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
      }),
      {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  static error(message, statusCode = 400, details = null) {
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        ...(details && { details }),
        timestamp: new Date().toISOString()
      }),
      {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  static notFound(resource = 'Resource') {
    return this.error(`${resource} not found`, 404);
  }

  static unauthorized(message = 'Unauthorized') {
    return this.error(message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return this.error(message, 403);
  }

  static badRequest(message = 'Bad Request', details = null) {
    return this.error(message, 400, details);
  }

  static internalError(message = 'Internal Server Error', details = null) {
    return this.error(message, 500, details);
  }

  static json(data, statusCode = 200) {
    return new Response(JSON.stringify(data), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export default ResponseHelper;
