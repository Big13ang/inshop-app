import { connection } from 'next/server';
import { readServerRuntimeConfig } from '@/lib/runtimeConfig';

// Serves the deploy-time URL overrides to the browser, so one build can be promoted
// between environments. Loaded as a blocking <script> by both root layouts.
export async function GET(): Promise<Response> {
  // Read the environment per request, never at build time
  await connection();
  const body = `window.__INSHOP_RUNTIME_CONFIG__=${JSON.stringify(readServerRuntimeConfig())};`;
  return new Response(body, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=60, must-revalidate',
    },
  });
}
