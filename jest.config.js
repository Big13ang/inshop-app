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
    'node_modules/(?!(msw|@mswjs|rettime|until-async|is-what|chalk)/)',
  ],
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/temp/',
    '/.next/',
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
