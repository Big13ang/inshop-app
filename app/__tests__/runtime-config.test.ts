/**
 * @jest-environment node
 */
import { GET } from '../runtime-config.js/route';

jest.mock('next/server', () => ({
  connection: jest.fn().mockResolvedValue(undefined),
}));

describe('GET /runtime-config.js', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.PUBLIC_API_URL;
    delete process.env.PUBLIC_CDN_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('serves the runtime overrides as a script that sets the window global', async () => {
    process.env.PUBLIC_API_URL = 'https://api.e2e.example.com';
    process.env.PUBLIC_CDN_URL = 'https://cdn.e2e.example.com/bucket';

    const response = await GET();

    expect(response.headers.get('Content-Type')).toBe('application/javascript; charset=utf-8');
    expect(await response.text()).toBe(
      'window.__INSHOP_RUNTIME_CONFIG__={"apiUrl":"https://api.e2e.example.com","cdnUrl":"https://cdn.e2e.example.com/bucket"};'
    );
  });

  it('serves an empty config when no override is set', async () => {
    const response = await GET();

    expect(await response.text()).toBe('window.__INSHOP_RUNTIME_CONFIG__={};');
  });
});
