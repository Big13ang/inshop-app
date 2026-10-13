'use client';

import { useEffect, useState, useRef, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';
import { Result } from '@/lib/utils/result';
import { storageKeys } from '@/lib/constants/storageKeys';

const DEFAULT_VIDEO_URL = '/videos/splash-screen/inshop-splash.mp4';
const DEFAULT_SPLASH_DURATION_MS = 3000; // Exact duration of the MP4 video asset (3.0s)
const EXIT_ANIMATION_DURATION_MS = 400;
const MAX_SAFETY_TIMEOUT_MS = 10000;
const SPLASH_SESSION_KEY = storageKeys.sessionStorage.app.splashSeen;

export interface SplashScreenProps {
  onComplete?: () => void;
  videoUrl?: string;
  durationMs?: number;
  persistSession?: boolean;
}

function checkHasSeenSplash(): boolean {
  const result = Result.trySync(() => window.sessionStorage.getItem(SPLASH_SESSION_KEY));
  return result.ok && result.value === 'true';
}

function markSplashSeen(): void {
  Result.trySync(() => {
    window.sessionStorage.setItem(SPLASH_SESSION_KEY, 'true');
  });
}

// useSyncExternalStore wiring — no actual store subscription needed; we only
// care about the server snapshot (false = "not seen") so both server and client
// start from the same agreed-upon value, preventing hydration mismatches.
const subscribeSplash = () => () => { };
const getSplashSnapshot = () => !checkHasSeenSplash(); // true = "should show"
const getServerSplashSnapshot = () => true;            // server: always render, so the first paint is the splash

export function SplashScreen({
  onComplete,
  videoUrl = DEFAULT_VIDEO_URL,
  durationMs: _durationMs = DEFAULT_SPLASH_DURATION_MS,
  persistSession = true,
}: SplashScreenProps) {
  /**
   * `shouldShow` is true on the server (via getServerSplashSnapshot) so the splash
   * is already in the SSR HTML and covers the feed on first paint. During hydration
   * React keeps that snapshot, then switches to getSplashSnapshot, which reads
   * sessionStorage and removes the splash if it was already seen this session.
   *
   * Hook must be called unconditionally — persistSession is factored in below.
   */
  const seenInSession = useSyncExternalStore(subscribeSplash, getSplashSnapshot, getServerSplashSnapshot);
  const shouldShow = persistSession ? seenInSession : true;

  const [phase, setPhase] = useState<'playing' | 'exiting' | 'finished'>('playing');
  const videoRef = useRef<HTMLVideoElement>(null);
  const onCompleteRef = useRef(onComplete);
  const isExitingRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const finishTransition = () => {
    setPhase('finished');
    if (persistSession) {
      markSplashSeen();
    }
    if (onCompleteRef.current) {
      onCompleteRef.current();
    }
  };

  const startExitTransition = () => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;

    setPhase('exiting');
    setTimeout(finishTransition, EXIT_ANIMATION_DURATION_MS);
  };

  const handleVideoEnded = () => {
    startExitTransition();
  };

  const handleVideoError = () => {
    startExitTransition();
  };

  const startExitTransitionRef = useRef(startExitTransition);
  startExitTransitionRef.current = startExitTransition;

  useEffect(() => {
    if (!shouldShow) return;

    if (videoRef.current && typeof videoRef.current.play === 'function') {
      Result.trySync(() => {
        const playPromise = videoRef.current?.play();
        if (playPromise !== undefined && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            startExitTransitionRef.current();
          });
        }
      });
    }

    const maxSafetyTimer = setTimeout(() => {
      startExitTransitionRef.current();
    }, MAX_SAFETY_TIMEOUT_MS);

    return () => {
      clearTimeout(maxSafetyTimer);
    };
  }, [shouldShow]);

  if (!shouldShow || phase === 'finished') {
    return null;
  }

  const isVisible = phase === 'playing';

  return (
    <div
      data-testid="splash-screen"
      className={cn(
        'fixed inset-0 z-fullscreen flex items-center justify-center bg-black overflow-hidden transition-opacity duration-400 ease-out',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <div className="relative w-full h-full md:max-w-app md:h-[var(--app-height)] flex items-center justify-center bg-black overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={handleVideoEnded}
          onError={handleVideoError}
          className="w-full h-full object-cover"
          data-testid="splash-video"
        />
      </div>
    </div>
  );
}
