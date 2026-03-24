/**
 * Global middleware for all Functions
 * Handles CORS, authentication, logging
 */

export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': context.env.ALLOWED_ORIGINS || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-PIN',
    'Access-Control-Max-Age': '86400',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  };

  // Handle preflight requests
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Add correlation ID for logging
  context.request.correlationId = crypto.randomUUID();

  // Log request
  console.log(`[${new Date().toISOString()}] ${context.request.method} ${url.pathname}`);

  // Continue to handler
  const response = await context.next();

  // Add CORS headers to response
  response.headers.set('Access-Control-Allow-Origin', headers['Access-Control-Allow-Origin']);
  response.headers.set('Access-Control-Allow-Methods', headers['Access-Control-Allow-Methods']);
  response.headers.set('Access-Control-Allow-Headers', headers['Access-Control-Allow-Headers']);

  return response;
}
