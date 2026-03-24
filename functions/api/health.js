/**
 * API Health Check
 * GET /api/health
 */

export async function onRequest(context) {
  return new Response(
    JSON.stringify({
      status: 'ok',
      message: 'CU Daters API is running',
      environment: context.env.ENVIRONMENT || 'production',
      timestamp: new Date().toISOString(),
      platform: 'Cloudflare Pages + Functions'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=60' // Cache for 1 minute
      }
    }
  );
}
