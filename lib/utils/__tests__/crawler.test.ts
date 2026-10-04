import { isCrawlerRequest } from '../crawler';
import { headers } from 'next/headers';

jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

describe('isCrawlerRequest util', () => {
  it('returns true for Googlebot', async () => {
    (headers as jest.Mock).mockResolvedValue({
      get: (name: string) => (name.toLowerCase() === 'user-agent' ? 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' : null),
    });

    const result = await isCrawlerRequest();
    expect(result).toBe(true);
  });

  it('returns true for TelegramBot', async () => {
    (headers as jest.Mock).mockResolvedValue({
      get: (name: string) => (name.toLowerCase() === 'user-agent' ? 'TelegramBot (like TwitterBot)' : null),
    });

    const result = await isCrawlerRequest();
    expect(result).toBe(true);
  });

  it('returns true for WhatsApp', async () => {
    (headers as jest.Mock).mockResolvedValue({
      get: (name: string) => (name.toLowerCase() === 'user-agent' ? 'WhatsApp/2.21.12.21 i' : null),
    });

    const result = await isCrawlerRequest();
    expect(result).toBe(true);
  });

  it('returns false for standard desktop Chrome user agent', async () => {
    (headers as jest.Mock).mockResolvedValue({
      get: (name: string) =>
        (name.toLowerCase() === 'user-agent'
          ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          : null),
    });

    const result = await isCrawlerRequest();
    expect(result).toBe(false);
  });

  it('returns false when user-agent header is missing', async () => {
    (headers as jest.Mock).mockResolvedValue({
      get: () => null,
    });

    const result = await isCrawlerRequest();
    expect(result).toBe(false);
  });

  it('returns false when headers() throws an error', async () => {
    (headers as jest.Mock).mockRejectedValue(new Error('Outside request scope'));

    const result = await isCrawlerRequest();
    expect(result).toBe(false);
  });
});
