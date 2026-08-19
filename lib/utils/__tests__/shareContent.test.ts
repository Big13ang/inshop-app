import { canShare, shareContent } from '../shareContent';

describe('shareContent utility', () => {
  const originalShare = navigator.share;

  afterEach(() => {
    if (originalShare !== undefined) {
      Object.defineProperty(navigator, 'share', {
        value: originalShare,
        writable: true,
        configurable: true,
      });
    } else {
      // @ts-expect-error removing property for test cleanup
      delete navigator.share;
    }
  });

  describe('canShare', () => {
    it('returns true when navigator.share is available', () => {
      Object.defineProperty(navigator, 'share', {
        value: jest.fn(),
        writable: true,
        configurable: true,
      });
      expect(canShare()).toBe(true);
    });

    it('returns false when navigator.share is not a function', () => {
      // @ts-expect-error setting to undefined for testing
      delete navigator.share;
      expect(canShare()).toBe(false);
    });
  });

  describe('shareContent', () => {
    it('shares content successfully when Web Share API is available', async () => {
      const shareMock = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: shareMock,
        writable: true,
        configurable: true,
      });

      const onSuccess = jest.fn();
      const shareData = { title: 'Title', text: 'Text', url: 'https://example.com' };
      const result = await shareContent(shareData, { onSuccess });

      expect(result).toBe(true);
      expect(shareMock).toHaveBeenCalledWith(shareData);
      expect(onSuccess).toHaveBeenCalled();
    });

    it('returns false and triggers onError when navigator.share fails', async () => {
      const error = new Error('Share cancelled');
      const shareMock = jest.fn().mockRejectedValue(error);
      Object.defineProperty(navigator, 'share', {
        value: shareMock,
        writable: true,
        configurable: true,
      });

      const onError = jest.fn();
      const result = await shareContent({ title: 'Title' }, { onError });

      expect(result).toBe(false);
      expect(onError).toHaveBeenCalledWith(error);
    });
  });
});
