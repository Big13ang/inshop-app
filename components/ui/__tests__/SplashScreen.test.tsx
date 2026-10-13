import { render, screen, act, fireEvent } from '@/lib/test-utils';
import { SplashScreen } from '../SplashScreen';
import { storageKeys } from '@/lib/constants/storageKeys';

const SPLASH_SESSION_KEY = storageKeys.sessionStorage.app.splashSeen;

describe('SplashScreen', () => {
  beforeAll(() => {
    window.HTMLMediaElement.prototype.play = jest.fn().mockImplementation(() => Promise.resolve());
  });

  beforeEach(() => {
    jest.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
    sessionStorage.clear();
  });

  it('renders splash overlay and video when not seen in session', () => {
    render(<SplashScreen />);

    expect(screen.getByTestId('splash-screen')).toBeInTheDocument();
    expect(screen.getByTestId('splash-video')).toBeInTheDocument();
  });

  it('stays hidden when splash was already marked seen in session', () => {
    sessionStorage.setItem(SPLASH_SESSION_KEY, 'true');

    render(<SplashScreen />);

    expect(screen.queryByTestId('splash-screen')).not.toBeInTheDocument();
  });

  it('transitions to finished and marks session storage when video ends', () => {
    const handleComplete = jest.fn();
    render(<SplashScreen onComplete={handleComplete} />);

    const video = screen.getByTestId('splash-video');
    act(() => {
      fireEvent.ended(video);
    });

    // During exit animation (400ms) — overlay fades out
    expect(screen.getByTestId('splash-screen')).toHaveClass('opacity-0');

    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(screen.queryByTestId('splash-screen')).not.toBeInTheDocument();
    expect(sessionStorage.getItem(SPLASH_SESSION_KEY)).toBe('true');
    expect(handleComplete).toHaveBeenCalledTimes(1);
  });

  it('transitions to finished when video triggers an error', () => {
    const handleComplete = jest.fn();
    render(<SplashScreen onComplete={handleComplete} />);

    const video = screen.getByTestId('splash-video');
    act(() => {
      fireEvent.error(video);
    });

    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(screen.queryByTestId('splash-screen')).not.toBeInTheDocument();
    expect(sessionStorage.getItem(SPLASH_SESSION_KEY)).toBe('true');
    expect(handleComplete).toHaveBeenCalledTimes(1);
  });

  it('transitions to finished via safety timeout fallback', () => {
    const handleComplete = jest.fn();
    render(<SplashScreen onComplete={handleComplete} />);

    expect(screen.getByTestId('splash-screen')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(screen.queryByTestId('splash-screen')).not.toBeInTheDocument();
    expect(sessionStorage.getItem(SPLASH_SESSION_KEY)).toBe('true');
    expect(handleComplete).toHaveBeenCalledTimes(1);
  });

  it('does not write to sessionStorage when persistSession is false', () => {
    render(<SplashScreen persistSession={false} />);

    const video = screen.getByTestId('splash-video');
    act(() => {
      fireEvent.ended(video);
    });

    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(screen.queryByTestId('splash-screen')).not.toBeInTheDocument();
    expect(sessionStorage.getItem(SPLASH_SESSION_KEY)).toBeNull();
  });
});
