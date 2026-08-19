import { copyToClipboard } from '../copyToClipboard';

describe('copyToClipboard utility', () => {
  const originalClipboard = navigator.clipboard;

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
  });

  it('copies text successfully using navigator.clipboard', async () => {
    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    const onSuccess = jest.fn();
    const result = await copyToClipboard('https://example.com', { onSuccess });

    expect(result).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith('https://example.com');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('handles writeText rejection gracefully', async () => {
    const error = new Error('Clipboard error');
    const writeTextMock = jest.fn().mockRejectedValue(error);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    const onError = jest.fn();
    const result = await copyToClipboard('https://example.com', { onError });

    expect(result).toBe(false);
    expect(onError).toHaveBeenCalledWith(error);
  });
});
