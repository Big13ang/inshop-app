import http from 'node:http';
import https from 'node:https';

const TARGET = process.env.DEV_PROXY_TARGET || 'https://api.dev.inshop.social';
const PORT = Number(process.env.DEV_PROXY_PORT || 8000);
const targetUrl = new URL(TARGET);

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || 'http://localhost:4000';

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Expose-Headers':
        'Content-Range, X-Content-Range, Location, Tus-Resumable, Tus-Version, Tus-Extension, Tus-Max-Size, Upload-Offset, Upload-Length, Upload-Metadata',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  const rawCookie = String(req.headers.cookie || '');
  const tokenMatch = rawCookie.match(/better-auth\.session_token=([^.;\s]+)/);

  const forwardHeaders = {
    ...req.headers,
    host: targetUrl.host,
    origin: targetUrl.origin,
    referer: `${targetUrl.origin}/`,
  };

  // Attach session token as Bearer header if available
  if (tokenMatch && tokenMatch[1] && !forwardHeaders.authorization) {
    forwardHeaders.authorization = `Bearer ${tokenMatch[1]}`;
  }

  // Duplicate cookie with __Secure- prefix if backend expects secure cookie
  if (rawCookie.includes('better-auth.session_token') && !rawCookie.includes('__Secure-better-auth.session_token')) {
    const secureCookie = rawCookie.replace(/better-auth\.session_token/g, '__Secure-better-auth.session_token');
    forwardHeaders.cookie = `${rawCookie}; ${secureCookie}`;
  }

  const proxyReq = https.request(
    {
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port || 443,
      path: req.url,
      method: req.method,
      headers: forwardHeaders,
    },
    (proxyRes) => {
      const resHeaders = { ...proxyRes.headers };

      // Ensure caller origin is allowed with credentials
      resHeaders['access-control-allow-origin'] = origin;
      resHeaders['access-control-allow-credentials'] = 'true';
      resHeaders['access-control-expose-headers'] =
        'Content-Range, X-Content-Range, Location, Tus-Resumable, Tus-Version, Tus-Extension, Tus-Max-Size, Upload-Offset, Upload-Length, Upload-Metadata';

      // Rewrite cookies for localhost
      const setCookie = proxyRes.headers['set-cookie'];
      if (setCookie) {
        const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
        resHeaders['set-cookie'] = cookies.map((c) =>
          c
            // 1. Strip __Secure- prefix so browsers accept over http://localhost
            .replace(/__Secure-/gi, '')
            // 2. Strip Domain attribute so cookie becomes host-only for localhost
            .replace(/;\s*Domain=[^;]+/gi, '')
            // 3. Strip Secure flag so cookie is stored over plain HTTP
            .replace(/;\s*Secure/gi, '')
            // 4. Ensure SameSite=Lax for proper cross-port localhost sharing
            .replace(/;\s*SameSite=[^;]+/gi, '; SameSite=Lax')
        );
      }

      res.writeHead(proxyRes.statusCode || 500, resHeaders);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    console.error(`[DevProxy] Error proxying ${req.method} ${req.url}:`, err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Proxy Gateway Error', message: err.message }));
    }
  });

  req.pipe(proxyReq);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 InShop Dev Proxy is running on http://localhost:${PORT}`);
  console.log(`🎯 Forwarding all traffic to: ${TARGET}`);
  console.log(`🍪 Cookie rewriting & Bearer token attachment active`);
  console.log(`======================================================\n`);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
