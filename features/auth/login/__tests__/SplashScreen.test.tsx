/// <reference types="@testing-library/jest-dom" />
import { render, screen, act, fireEvent } from '@testing-library/react';
import SplashScreen from '../components/SplashScreen';

describe('SplashScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Mock HTMLMediaElement.prototype.play
    window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('renders fullscreen video with default video URL', () => {
    render(<SplashScreen />);

    const videoEl = screen.getByTestId('splash-video');
    expect(videoEl).toBeInTheDocument();
    expect(videoEl).toHaveAttribute('src', 'https://inshop-static-asset.s3.ir-thr-at1.arvanstorage.ir/inshop-splash.mp4');
  });

  it('renders with custom video URL if provided', () => {
    const customUrl = 'https://example.com/custom-splash.mp4';
    render(<SplashScreen videoUrl={customUrl} />);

    const videoEl = screen.getByTestId('splash-video');
    expect(videoEl).toHaveAttribute('src', customUrl);
  });

  it('triggers onComplete callback when video finishes playing (onEnded)', () => {
    const handleComplete = jest.fn();
    render(<SplashScreen onComplete={handleComplete} durationMs={2500} />);

    const videoEl = screen.getByTestId('splash-video');

    act(() => {
      fireEvent.playing(videoEl);
      fireEvent.ended(videoEl);
    });

    // Advance exit animation timer (400ms)
    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(handleComplete).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('splash-screen')).not.toBeInTheDocument();
  });

  it('triggers onComplete callback via safety fallback if video load stalls', () => {
    const handleComplete = jest.fn();
    render(<SplashScreen onComplete={handleComplete} durationMs={1000} />);

    // Fast-forward past max safety timer (10000ms safety + 400ms exit = 10400ms)
    act(() => {
      jest.advanceTimersByTime(10500);
    });

    expect(handleComplete).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('splash-screen')).not.toBeInTheDocument();
  });

  it('cleans up timers when unmounted early', () => {
    const handleComplete = jest.fn();
    const { unmount } = render(<SplashScreen onComplete={handleComplete} durationMs={1000} />);

    unmount();

    act(() => {
      jest.advanceTimersByTime(7000);
    });

    expect(handleComplete).not.toHaveBeenCalled();
  });
});


