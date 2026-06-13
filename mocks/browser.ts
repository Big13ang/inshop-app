import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * MSW browser worker — for use in the dev environment (not Jest).
 *
 * To enable in your dev app:
 *   import { worker } from '@/mocks/browser';
 *   worker.start();
 */
export const worker = setupWorker(...handlers);
