/**
 * Polyfills required by MSW v2 in jsdom/Jest environment.
 * Runs BEFORE jest.setup.ts (listed under `setupFiles`, not `setupFilesAfterEnv`).
 *
 * Node 22 ships fetch, Request, Response, Headers natively.
 * jsdom's test environment doesn't expose these — so we copy them from globalThis.
 */

// Configure React 19 act environment globally before any React imports
global.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
if (typeof window !== 'undefined') {
  window.IS_REACT_ACT_ENVIRONMENT = true;
}
var IS_REACT_ACT_ENVIRONMENT = true;

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
  IS_REACT_ACT_ENVIRONMENT: true,
});
