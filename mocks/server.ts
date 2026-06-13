import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW server for Jest/Node environment.
 * Lifecycle is managed in jest.setup.ts (beforeAll/afterEach/afterAll).
 */
export const server = setupServer(...handlers);
