'use client';

import { useEffect } from 'react';

/**
 * Keeps the app shell aligned with the region iOS Safari actually leaves visible.
 *
 * Two custom properties are published on <html>:
 *   --app-height     → height of the visible strip (excludes Safari's toolbars
 *                      and, while typing, the on-screen keyboard)
 *   --app-offset-top → how far that strip is pushed down inside the layout
 *                      viewport (non-zero only while the keyboard is up)
 *   --app-offset-bottom → space left below the strip: Safari's bottom toolbar
 *                      plus the keyboard. Use it to bottom-anchor any fixed
 *                      overlay so it lands on the keyboard, not behind it.
 *
 * `100dvh` is not enough on iOS: it lags behind the toolbar collapse animation
 * and, with `viewport-fit=cover`, spans the area the toolbars draw over — which
 * is what pushes a `sticky top-0` header under the dynamic island or hides the
 * bottom of the app behind Safari's nav bar.
 *
 * The keyboard needs the same treatment. `position: fixed` is resolved against
 * the *layout* viewport, which does not shrink when the keyboard opens; iOS
 * instead shifts the visual viewport inside it to reveal the focused field. A
 * shell sized to the layout height therefore gets shoved off the top of the
 * screen, leaving a blank band above the keyboard. Sizing to the visual
 * viewport and re-adding its `offsetTop` keeps the shell exactly on the visible
 * strip, so the field the user is typing into stays in front of them.
 */
const KEYBOARD_THRESHOLD_PX = 120;
const SCROLL_INTO_VIEW_DELAY_MS = 250;

function isTextEntry(el: EventTarget | null): el is HTMLElement {
  const node = el as HTMLElement | null;
  if (!node || !node.tagName) return false;
  return (
    node.tagName === 'INPUT' ||
    node.tagName === 'TEXTAREA' ||
    node.tagName === 'SELECT' ||
    node.isContentEditable
  );
}

function applyViewportMetrics() {
  const root = document.documentElement;
  const layoutHeight = window.innerHeight;
  const viewport = window.visualViewport;
  const visualHeight = Math.min(layoutHeight, viewport?.height ?? layoutHeight);
  const offsetTop = viewport?.offsetTop ?? 0;
  const isKeyboardOpen = layoutHeight - visualHeight > KEYBOARD_THRESHOLD_PX;

  const offsetBottom = Math.max(0, layoutHeight - offsetTop - visualHeight);

  root.style.setProperty('--app-height', `${Math.round(visualHeight)}px`);
  root.style.setProperty('--app-offset-top', `${Math.round(offsetTop)}px`);
  root.style.setProperty('--app-offset-bottom', `${Math.round(offsetBottom)}px`);

  if (isKeyboardOpen) {
    // The home indicator is covered by the keyboard, so its inset would only add
    // a blank gap between the app and the keys.
    root.style.setProperty('--safe-bottom', '0px');
    root.dataset.keyboard = 'open';
  } else {
    root.style.removeProperty('--safe-bottom');
    delete root.dataset.keyboard;
  }
}

function findScrollableAncestor(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el.parentElement;

  while (node && node !== document.body) {
    const { overflowY } = getComputedStyle(node);
    const scrolls = overflowY === 'auto' || overflowY === 'scroll';
    if (scrolls && node.scrollHeight > node.clientHeight) return node;
    node = node.parentElement;
  }

  return null;
}

/**
 * The shell shrinks instead of scrolling, so iOS' own "reveal the focused
 * field" pass has nothing to act on — we scroll the field into view inside
 * whichever container actually scrolls.
 */
function scrollFocusedIntoView(e: FocusEvent) {
  const target = e.target;
  if (!isTextEntry(target)) return;

  setTimeout(() => {
    if (document.activeElement !== target) return;
    if (!findScrollableAncestor(target)) return;
    target.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, SCROLL_INTO_VIEW_DELAY_MS);
}

function resetIosViewportScroll(e: FocusEvent) {
  const target = e.target as HTMLElement | null;
  const relatedTarget = e.relatedTarget as HTMLElement | null;

  if (isTextEntry(target)) {
    // Moving between two fields keeps the keyboard up — nothing to reset.
    if (isTextEntry(relatedTarget)) return;

    // Only attempt scroll reset if the window viewport was actually shifted off origin
    setTimeout(() => {
      if (typeof window !== 'undefined' && (window.scrollY > 0 || (document.body && document.body.scrollTop > 0))) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        if (document.body) document.body.scrollTop = 0;
      }
      applyViewportMetrics();
    }, 100);
  }
}

export default function IosViewportFixer() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    applyViewportMetrics();

    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', applyViewportMetrics);
    viewport?.addEventListener('scroll', applyViewportMetrics);
    window.addEventListener('resize', applyViewportMetrics);
    window.addEventListener('orientationchange', applyViewportMetrics);
    window.addEventListener('focusin', scrollFocusedIntoView);
    window.addEventListener('focusout', resetIosViewportScroll);

    return () => {
      viewport?.removeEventListener('resize', applyViewportMetrics);
      viewport?.removeEventListener('scroll', applyViewportMetrics);
      window.removeEventListener('resize', applyViewportMetrics);
      window.removeEventListener('orientationchange', applyViewportMetrics);
      window.removeEventListener('focusin', scrollFocusedIntoView);
      window.removeEventListener('focusout', resetIosViewportScroll);
    };
  }, []);

  return null;
}
