'use client';

import { useEffect } from 'react';

function resetIosViewportScroll(e: FocusEvent) {
  const target = e.target as HTMLElement | null;
  if (
    target &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable)
  ) {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.body.scrollTop = 0;
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
