'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const emptySubscribe = () => () => { };

interface BottomSheetContextValue {
  onClose: () => void;
  backdropRef: React.RefObject<HTMLDivElement | null>;
  panelRef: React.RefObject<HTMLDivElement | null>;
}

const BottomSheetContext = React.createContext<BottomSheetContextValue | null>(null);

function useBottomSheet() {
  const ctx = React.use(BottomSheetContext);
  if (!ctx) throw new Error('BottomSheet parts must be used inside BottomSheet.Root');
  return ctx;
}

// ─── Root ────────────────────────────────────────────────────────────────────

interface RootProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function Root({ isOpen, onClose, children }: RootProps) {
  const isMounted = React.useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [shouldRender, setShouldRender] = React.useState(isOpen);

  if (isOpen && !shouldRender) setShouldRender(true);

  const dialogRef = React.useRef<HTMLDivElement>(null);
  const backdropRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!shouldRender) return;

    const backdrop = backdropRef.current;
    const panel = panelRef.current;

    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialogRef.current?.focus();

      gsap.killTweensOf([backdrop, panel]);
      gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'sine.out' });
      gsap.fromTo(panel, { y: '120%' }, { y: 0, duration: 0.35, ease: 'back.out(0.65)' });

      return () => { document.body.style.overflow = prev; };
    }

    gsap.killTweensOf([backdrop, panel]);
    gsap.to(backdrop, { opacity: 0, duration: 0.25, ease: 'sine.in' });
    gsap.to(panel, { y: '120%', duration: 0.3, ease: 'power3.in', onComplete: () => setShouldRender(false) });
  }, [isOpen, shouldRender]);

  if (!isMounted || !shouldRender) return null;

  return createPortal(
    <BottomSheetContext value={{ onClose, backdropRef, panelRef }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
        tabIndex={-1}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        className="fixed inset-0 z-50 flex flex-col justify-end p-4 pb-6 overflow-hidden focus:outline-none"
      >
        {children}
      </div>
    </BottomSheetContext>,
    document.body
  );
}

// ─── Overlay ─────────────────────────────────────────────────────────────────

function Overlay({ className }: { className?: string }) {
  const { onClose, backdropRef } = useBottomSheet();
  return (
    <div
      ref={backdropRef}
      onClick={onClose}
      className={cn('absolute inset-0 bg-zinc-950/40 backdrop-blur-[4px] cursor-pointer will-change-transform', className)}
    />
  );
}

// ─── Panel ───────────────────────────────────────────────────────────────────

interface PanelProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  dir?: 'rtl' | 'ltr' | 'auto';
  dragToDismiss?: boolean;
  className?: string;
}

const maxWidthClass: Record<NonNullable<PanelProps['maxWidth']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  none: 'max-w-none',
};

function Panel({ children, maxWidth = 'md', dir = 'rtl', dragToDismiss = true, className }: PanelProps) {
  const { panelRef, backdropRef, onClose } = useBottomSheet();
  const isDraggingRef = React.useRef(false);
  const startYRef = React.useRef(0);
  const currentYRef = React.useRef(0);
  const startTimeRef = React.useRef(0);

  const onDragStart = (clientY: number) => {
    if (!dragToDismiss) return;
    isDraggingRef.current = true;
    startYRef.current = clientY;
    currentYRef.current = 0;
    startTimeRef.current = Date.now();
    if (panelRef.current) {
      gsap.killTweensOf(panelRef.current);
      panelRef.current.style.transition = 'none';
      panelRef.current.style.cursor = 'grabbing';
    }
  };

  const onDragMove = (clientY: number) => {
    if (!isDraggingRef.current || !panelRef.current) return;
    const offset = clientY - startYRef.current;
    if (offset > 0) {
      currentYRef.current = offset;
      panelRef.current.style.transform = `translateY(${offset}px)`;
      if (backdropRef.current) {
        backdropRef.current.style.opacity = String(Math.max(0, 1 - offset / 450));
      }
    }
  };

  const onDragEnd = () => {
    if (!isDraggingRef.current || !panelRef.current) return;
    isDraggingRef.current = false;
    panelRef.current.style.cursor = '';

    const deltaY = currentYRef.current;
    const velocity = deltaY / (Date.now() - startTimeRef.current || 1);

    if (deltaY > 100 || (deltaY > 20 && velocity > 0.4)) {
      gsap.to(panelRef.current, { y: '120%', duration: 0.25, ease: 'power2.in', onComplete: onClose });
      if (backdropRef.current) gsap.to(backdropRef.current, { opacity: 0, duration: 0.2 });
    } else {
      gsap.to(panelRef.current, { y: 0, duration: 0.3, ease: 'power3.out', clearProps: 'transform' });
      if (backdropRef.current) gsap.to(backdropRef.current, { opacity: 1, duration: 0.25 });
    }
  };

  return (
    <div
      ref={panelRef}
      dir={dir}
      onTouchStart={(e) => onDragStart(e.touches[0].clientY)}
      onTouchMove={(e) => onDragMove(e.touches[0].clientY)}
      onTouchEnd={onDragEnd}
      onMouseDown={(e) => onDragStart(e.clientY)}
      onMouseMove={(e) => { if (e.buttons === 1) onDragMove(e.clientY); }}
      onMouseUp={onDragEnd}
      onMouseLeave={onDragEnd}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'relative w-full mx-auto bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col max-h-[92vh] select-none will-change-transform',
        dragToDismiss && 'cursor-grab active:cursor-grabbing',
        maxWidthClass[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Handle ──────────────────────────────────────────────────────────────────

function Handle() {
  return <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-700/80 rounded-full mx-auto my-3 shrink-0" aria-hidden />;
}

// ─── Header ──────────────────────────────────────────────────────────────────

function Header({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start gap-4 px-6 pb-4 pt-1 border-b border-zinc-100 dark:border-zinc-800/60 shrink-0', className)}>
      {children}
    </div>
  );
}

// ─── Title ───────────────────────────────────────────────────────────────────

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h3 id="bottom-sheet-title" className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-6">
      {children}
    </h3>
  );
}

// ─── Description ─────────────────────────────────────────────────────────────

function Description({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-zinc-400 font-medium leading-relaxed">{children}</p>;
}

// ─── Close ───────────────────────────────────────────────────────────────────

function Close() {
  const { onClose } = useBottomSheet();
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="بستن"
      className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer focus-visible:outline-none"
    >
      <X className="w-5 h-5 shrink-0" />
    </button>
  );
}

// ─── Content ─────────────────────────────────────────────────────────────────

function Content({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn('flex-1 overflow-y-auto px-6 py-4 cursor-default select-text', className)}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn('p-4 bg-zinc-50/30 dark:bg-zinc-950/20 border-t border-zinc-100 dark:border-zinc-800/80 shrink-0 cursor-default', className)}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

// ─── Export ──────────────────────────────────────────────────────────────────

export const BottomSheet = {
  Root,
  Overlay,
  Panel,
  Handle,
  Header,
  Title,
  Description,
  Close,
  Content,
  Footer,
};
