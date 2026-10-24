import { E2E_ENV } from './support/env';

const READY_TIMEOUT_MS = 120_000;

async function isUp(url: string): Promise<boolean> {
  const response = await fetch(url).catch(() => null);
  return response?.ok ?? false;
}

async function waitUntilUp(url: string): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await isUp(url)) return;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`E2E stack not ready: ${url} did not respond within ${READY_TIMEOUT_MS / 1000}s`);
}

/** Fails fast with a clear message when the stack isn't running. */
export default async function globalSetup(): Promise<void> {
  await waitUntilUp(`${E2E_ENV.apiUrl}/health/ready`);
  await waitUntilUp(`${E2E_ENV.baseUrl}/runtime-config.js`);
}
