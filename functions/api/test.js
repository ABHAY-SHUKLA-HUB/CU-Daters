/**
 * Test endpoint to verify Functions are working
 * GET /api/test
 */

export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const name = searchParams.get('name') || 'World';

  return new Response(
    JSON.stringify({
      success: true,
      message: `Hello ${name}!`,
      timestamp: new Date().toISOString(),
      kv_available: !!context.env.CACHE,
      r2_available: !!context.env.R2_BUCKET,
      durable_objects_available: false
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
