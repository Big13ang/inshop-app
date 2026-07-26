'use client';

import { useEffect } from 'react';

function resetIosViewportScroll(e: FocusEvent) {
  const target = e.target as HTMLElement | null;
  const relatedTarget = e.relatedTarget as HTMLElement | null;

  if (
    target &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable)
  ) {
    if (
      relatedTarget &&
      (relatedTarget.tagName === 'INPUT' ||
        relatedTarget.tagName === 'TEXTAREA' ||
        relatedTarget.tagName === 'SELECT' ||
        relatedTarget.isContentEditable)
    ) {
      return;
    }

    // Only attempt scroll reset if the window viewport was actually shifted off origin
    setTimeout(() => {
      if (typeof window !== 'undefined' && (window.scrollY > 0 || (document.body && document.body.scrollTop > 0))) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        if (document.body) document.body.scrollTop = 0;
      }
    }, 100);
  }
}

export default function IosViewportFixer() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('focusout', resetIosViewportScroll);
    return () => {
      window.removeEventListener('focusout', resetIosViewportScroll);
    };
  }, []);

  return null;
}
