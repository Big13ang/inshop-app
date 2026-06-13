/**
 * Polyfills required by MSW v2 in jsdom/Jest environment.
 * Runs BEFORE jest.setup.ts (listed under `setupFiles`, not `setupFilesAfterEnv`).
 *
 * Node 22 ships fetch, Request, Response, Headers natively.
 * jsdom's test environment doesn't expose these — so we copy them from globalThis.
 */

import { TextDecoder, TextEncoder } from 'util';
import { ReadableStream } from 'stream/web';

// Re-expose Node 22 built-in fetch globals into the global scope that jsdom uses
Object.assign(global, {
  TextDecoder,
  TextEncoder,
  ReadableStream,
  // Node 22 native globals
  fetch: globalThis.fetch,
  Request: globalThis.Request,
  Response: globalThis.Response,
  Headers: globalThis.Headers,
  FormData: globalThis.FormData,
});
