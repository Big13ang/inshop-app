import http from 'node:http';
import https from 'node:https';
import { spawn } from 'node:child_process';
import { buildAllowedOrigins, rewriteLocation } from './devProxyHelpers.mjs';

const TARGET = process.env.DEV_PROXY_TARGET || 'https://api.dev.inshop.social';
const PORT = Number(process.env.DEV_PROXY_PORT || 8000);
// Loopback by default so the proxy (which attaches auth to forwarded requests)
// is not reachable from the LAN. Opt in with DEV_PROXY_HOST=0.0.0.0.
const HOST = process.env.DEV_PROXY_HOST || '127.0.0.1';
const allowedOrigins = buildAllowedOrigins(process.env.DEV_PROXY_ALLOWED_ORIGINS);
const targetUrl = new URL(TARGET);
const isWithNext = process.argv.includes('--with-next');
const client = targetUrl.protocol === 'http:' ? http : https;

let nextChild = null;

const server = http.createServer((req, res) => {
  // Only reflect allowlisted origins (credentials are allowed, so never reflect blindly).
  const requestOrigin = req.headers.origin;
  const origin = requestOrigin && allowedOrigins.has(requestOrigin) ? requestOrigin : null;
  const proxyOrigin = `http://${req.headers.host}`;

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    if (!origin) {
      res.writeHead(403);
      res.end();
      return;
    }
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
  // better-auth's session cookie is a signed value `<token>.<hmac>`; the Bearer
  // flow expects only the raw token, so keep the part before the dot.
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

  const proxyReq = client.request(
    {
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port || (targetUrl.protocol === 'http:' ? 80 : 443),
      path: req.url,
      method: req.method,
      headers: forwardHeaders,
    },
    (proxyRes) => {
      const resHeaders = { ...proxyRes.headers };

      // Ensure caller origin is allowed with credentials
      if (origin) {
        resHeaders['access-control-allow-origin'] = origin;
        resHeaders['access-control-allow-credentials'] = 'true';
        resHeaders['access-control-expose-headers'] =
          'Content-Range, X-Content-Range, Location, Tus-Resumable, Tus-Version, Tus-Extension, Tus-Max-Size, Upload-Offset, Upload-Length, Upload-Metadata';
      }

      // TUS builds Location from the Host it received (the remote API). Point it
      // back at this proxy so the PATCH stays same-site and carries the cookie.
      if (resHeaders.location) {
        resHeaders.location = rewriteLocation(resHeaders.location, targetUrl, proxyOrigin);
      }

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
      res.writeHead(502, {
        'Content-Type': 'application/json',
        ...(origin
          ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true' }
          : {}),
      });
      res.end(JSON.stringify({ error: 'Proxy Gateway Error', message: err.message }));
    }
  });

  req.on('error', (err) => {
    proxyReq.destroy(err);
  });

  req.pipe(proxyReq);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n======================================================`);
    console.error(`❌ [DevProxy Error] Port ${PORT} is already in use!`);
    console.error(`👉 Cause: Another process or container is occupying port ${PORT}.`);
    console.error(`👉 If the local backend Docker container is running:`);
    console.error(`   rtk docker stop inshop-back-end-app-1`);
    console.error(`👉 If another node or proxy process is running:`);
    console.error(`   fuser -k ${PORT}/tcp`);
    console.error(`======================================================\n`);
  } else {
    console.error(`[DevProxy Error]`, err);
  }
  process.exit(1);
});

function cleanup() {
  if (nextChild) {
    if (process.platform === 'win32' && nextChild.pid) {
      spawn('taskkill', ['/pid', String(nextChild.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      nextChild.kill('SIGTERM');
    }
    nextChild = null;
  }
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

server.listen(PORT, HOST, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 InShop Dev Proxy is running on http://${HOST}:${PORT}`);
  console.log(`🎯 Forwarding all traffic to: ${TARGET}`);
  console.log(`🍪 Cookie rewriting & Bearer token attachment active`);
  console.log(`======================================================\n`);

  if (isWithNext) {
    nextChild = spawn('npx next dev -H 0.0.0.0 -p 4000', {
      stdio: 'inherit',
      env: process.env,
      shell: true,
    });

    nextChild.on('error', (err) => {
      console.error('[DevProxy] Error starting Next.js dev server:', err);
    });

    nextChild.on('exit', (code, signal) => {
      server.close(() => {
        process.exit(code ?? (signal ? 1 : 0));
      });
    });
  }
});

