import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Start the MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset any request handlers that were added during tests
afterEach(() => server.resetHandlers());

// Stop the server after all tests
afterAll(() => server.close());
