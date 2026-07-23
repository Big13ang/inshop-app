'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

const DEFAULT_VIDEO_URL = 'https://inshop-static-asset.s3.ir-thr-at1.arvanstorage.ir/inshop-splash.mp4';
const DEFAULT_SPLASH_DURATION_MS = 3000; // Exact duration of the MP4 video asset (3.0s)
const EXIT_ANIMATION_DURATION_MS = 400;

export interface SplashScreenProps {
  onComplete?: () => void;
  videoUrl?: string;
  durationMs?: number;
}

export default function SplashScreen({
  onComplete,
  videoUrl = DEFAULT_VIDEO_URL,
  durationMs: _durationMs = DEFAULT_SPLASH_DURATION_MS,
}: SplashScreenProps) {
  const [phase, setPhase] = useState<'playing' | 'exiting' | 'finished'>('playing');
  const videoRef = useRef<HTMLVideoElement>(null);

  const onCompleteRef = useRef(onComplete);
  const isExitingRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const startExitTransition = () => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;

    setPhase('exiting');

    setTimeout(() => {
      setPhase('finished');
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }, EXIT_ANIMATION_DURATION_MS);
  };

  const handleVideoEnded = () => {
    startExitTransition();
  };

  const handleVideoError = () => {
    startExitTransition();
  };

  useEffect(() => {
    if (videoRef.current && typeof videoRef.current.play === 'function') {
      try {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            // Autoplay policy fallback
            startExitTransition();
          });
        }
      } catch {
        // Ignore jsdom un-implemented HTMLMediaElement warning in test env
      }
    }

    // Safety fallback timer for extreme network delays / blocked autoplay (10s max)
    const maxSafetyTimer = setTimeout(() => {
      startExitTransition();
    }, 10000);

    return () => {
      clearTimeout(maxSafetyTimer);
    };
  }, []);

  if (phase === 'finished') {
    return null;
  }

  const isVisible = phase === 'playing';

  return (
    <div
      data-testid="splash-screen"
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden transition-opacity duration-400 ease-out',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <div
        className={cn(
          'relative w-full h-full md:max-w-app md:h-dvh flex items-center justify-center bg-black overflow-hidden transition-transform duration-400 ease-out',
          isVisible ? 'scale-100' : 'scale-105'
        )}
      >
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



