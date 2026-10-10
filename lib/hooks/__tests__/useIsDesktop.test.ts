import { renderHook, act } from '@testing-library/react';
import { useIsDesktop, isDesktopDevice } from '../useIsDesktop';
import * as platform from '@/lib/utils/platform';

jest.mock('@/lib/utils/platform', () => ({
  isMobile: jest.fn(),
}));

describe('useIsDesktop', () => {
  const originalInnerWidth = window.innerWidth;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    jest.clearAllMocks();
    (platform.isMobile as jest.Mock).mockReturnValue(false);
    window.innerWidth = 1024;
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: !!query.includes('min-width: 768px'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  afterEach(() => {
    window.innerWidth = originalInnerWidth;
    window.matchMedia = originalMatchMedia;
  });

  it('returns true when viewport width is >= 768px and not mobile', () => {
    window.innerWidth = 1024;
    (platform.isMobile as jest.Mock).mockReturnValue(false);

    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(true);
    expect(isDesktopDevice()).toBe(true);
  });

  it('returns false when viewport width is < 768px', () => {
    window.innerWidth = 500;
    (platform.isMobile as jest.Mock).mockReturnValue(false);

    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(false);
    expect(isDesktopDevice()).toBe(false);
  });

  it('returns false when isMobile is true and no fine pointer exists', () => {
    window.innerWidth = 700;
    (platform.isMobile as jest.Mock).mockReturnValue(true);

    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(false);
  });

  it('updates dynamically on window resize', () => {
    window.innerWidth = 1024;
    (platform.isMobile as jest.Mock).mockReturnValue(false);

    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(true);

    act(() => {
      window.innerWidth = 600;
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toBe(false);

    act(() => {
      window.innerWidth = 1200;
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toBe(true);
  });
});
