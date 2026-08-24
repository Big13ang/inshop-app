process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
process.env.NEXT_PUBLIC_CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || 'http://localhost:9000/inshop-uploads';
process.env.NEXT_PUBLIC_DEBUG_AUTH = process.env.NEXT_PUBLIC_DEBUG_AUTH || 'false';
process.env.NEXT_PUBLIC_GLITCHTIP_DSN = process.env.NEXT_PUBLIC_GLITCHTIP_DSN || 'https://c39862cad26a45aaa1f72b6e9e8c50dc@errors.inshop.social/5';
process.env.NEXT_PUBLIC_SENTRY_RELEASE = process.env.NEXT_PUBLIC_SENTRY_RELEASE || 'test-release';
process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'test';
process.env.NEXT_PUBLIC_GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';
process.env.NEXT_PUBLIC_GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';
process.env.GLITCHTIP_DSN = process.env.GLITCHTIP_DSN || 'https://c39862cad26a45aaa1f72b6e9e8c50dc@errors.inshop.social/5';
process.env.SENTRY_RELEASE = process.env.SENTRY_RELEASE || 'test-release';
process.env.SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || 'test';
process.env.E2E_MOCK = process.env.E2E_MOCK || 'false';

import '@testing-library/jest-dom';
import mockReact from 'react';
import { server } from './mocks/server';
import { resetPendingPostsFixture } from './mocks/handlers';

jest.mock(
  'react-intersection-observer',
  () => ({
    useInView: () => ({
      ref: jest.fn(),
      inView: false,
    }),
  }),
  { virtual: true }
);

jest.mock('sonner', () => ({
  Toaster: () => null,
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('@/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:3000',
    NEXT_PUBLIC_CDN_URL: 'http://localhost:9000/inshop-uploads',
    NEXT_PUBLIC_DEBUG_AUTH: 'false',
    NEXT_PUBLIC_GLITCHTIP_DSN: 'https://c39862cad26a45aaa1f72b6e9e8c50dc@errors.inshop.social/5',
    NEXT_PUBLIC_SENTRY_RELEASE: 'test-release',
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: 'test',
    NEXT_PUBLIC_GA_ID: '',
    NEXT_PUBLIC_GTM_ID: '',
    GLITCHTIP_DSN: 'https://c39862cad26a45aaa1f72b6e9e8c50dc@errors.inshop.social/5',
    SENTRY_RELEASE: 'test-release',
    SENTRY_ENVIRONMENT: 'test',
    E2E_MOCK: 'false',
  },
}));

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
  usePathname() {
    return '';
  },
}));

jest.mock('@tanstack/react-query', () => {
  const original = jest.requireActual('@tanstack/react-query');
  return {
    ...original,
    useQueryClient: () => {
      try {
        return original.useQueryClient();
      } catch {
        return {
          invalidateQueries: jest.fn(),
          setQueryData: jest.fn(),
        };
      }
    },
  };
});

// jsdom does not implement PointerEvent, which Base UI components (Switch, Menu,
// Dialog) construct while handling interactions. MouseEvent covers everything
// those handlers read.
if (typeof window !== 'undefined' && typeof window.PointerEvent !== 'function') {
  class MockPointerEvent extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    readonly isPrimary: boolean;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.pointerType = params.pointerType ?? 'mouse';
      this.isPrimary = params.isPrimary ?? true;
    }
  }

  window.PointerEvent = MockPointerEvent as unknown as typeof PointerEvent;
  globalThis.PointerEvent = window.PointerEvent;
}

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
afterEach(() => {
  server.resetHandlers();
  resetPendingPostsFixture();
});

// Stop the server after all tests
afterAll(() => server.close());
