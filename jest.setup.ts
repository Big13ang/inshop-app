import '@testing-library/jest-dom';
import mockReact from 'react';
import { server } from './mocks/server';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: mockReact.ComponentProps<'img'>) => {
    return mockReact.createElement('img', props);
  },
}));

jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  useSearchParams() {
    return {
      get: jest.fn(),
    };
  },
}));

// jsdom's window.crypto lacks SubtleCrypto (.subtle). Expose Node's webcrypto.
if (!globalThis.crypto?.subtle) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { webcrypto } = require('crypto') as typeof import('crypto');
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    writable: true,
    value: webcrypto,
  });
}

// jest-fixed-jsdom replaces global.Blob with Node's Blob (which has arrayBuffer),
// but jsdom's File still inherits from jsdom's internal Blob, which does NOT have
// arrayBuffer. Patch it by walking up the File prototype chain.
{
  const jsFile = new File([], 'probe.txt');
  // File.prototype → jsdom Blob.prototype → Object.prototype
  const jsdomBlobProto = Object.getPrototypeOf(Object.getPrototypeOf(jsFile)) as Blob;
  if (typeof (jsdomBlobProto as { arrayBuffer?: unknown }).arrayBuffer !== 'function') {
    Object.defineProperty(jsdomBlobProto, 'arrayBuffer', {
      configurable: true,
      writable: true,
      value: function (this: Blob): Promise<ArrayBuffer> {
        return new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = () => reject(reader.error);
          reader.readAsArrayBuffer(this);
        });
      },
    });
  }
}

// Start the MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset any request handlers that were added during tests
afterEach(() => server.resetHandlers());

// Stop the server after all tests
afterAll(() => server.close());
