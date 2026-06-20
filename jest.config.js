/** @type {import('jest').Config} */
const config = {
  // jest-fixed-jsdom properly exposes Node's native fetch globals (Request, Response, etc.)
  // that MSW v2 interceptors need at module load time.
  testEnvironment: 'jest-fixed-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    // Force MSW to resolve to its precompiled CJS builds (avoids ESM/TS source)
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
    '^msw$': '<rootDir>/node_modules/msw/lib/core/index.js',
    // tus-js-client's "main" resolves to its Node (http module) build; Jest's
    // resolver ignores the package's "browser" field, so point at the XHR
    // build directly to match runtime behavior under jsdom.
    '^tus-js-client$': '<rootDir>/node_modules/tus-js-client/lib.es5/browser/index.js',
    // Path alias: @/* -> root (mirrors tsconfig paths)
    '^@/(.*)$': '<rootDir>/$1',
    // CSS Modules
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Static assets
    '\\.(jpg|jpeg|png|gif|webp|svg|ico)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\\.(t|j)sx?$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
    }],
    '^.+\\.mjs$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
      ],
    }],
  },
  // Transform ESM-only packages that ship no CJS build
  transformIgnorePatterns: [
    'node_modules/(?!(msw|@mswjs|@open-draft|rettime|until-async|is-what|chalk|p-limit|yocto-queue|p-retry|is-network-error)/)',
  ],
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/temp/',
    '/.next/',
    '/e2e/',
  ],
  collectCoverageFrom: [
    'features/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/__tests__/**',
    '!**/*.d.ts',
  ],
};

module.exports = config;
