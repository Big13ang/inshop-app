import * as React from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { cn } from '@/lib/utils';

interface DialogContextType {
  isOpen: boolean;
  onClose: () => void;
  shouldRender: boolean;
}

const DialogContext = React.createContext<DialogContextType | undefined>(undefined);

export function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog.Root');
  }
  return context;
}

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  (ref as React.MutableRefObject<T | null>).current = value;
}

interface DialogRootProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function DialogRoot({ isOpen, onClose, children }: DialogRootProps) {
  const [shouldRender, setShouldRender] = React.useState(isOpen);
  const [prevIsOpen, setPrevIsOpen] = React.useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setShouldRender(true);
    }
  }

  React.useEffect(() => {
    if (isOpen) {
      return;
    }

    const timer = window.setTimeout(() => setShouldRender(false), 320);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const value = { isOpen, onClose, shouldRender };

  return (
    <DialogContext.Provider value={value}>
      {children}
    </DialogContext.Provider>
  );
}

function DialogPortal({ children }: { children: React.ReactNode }) {
  const { shouldRender } = useDialog();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted || !shouldRender) return null;
  return createPortal(children, document.body);
}

interface DialogOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>;
}

function DialogOverlay({ className, onClick, ref, ...props }: DialogOverlayProps) {
  const { onClose, isOpen } = useDialog();
  const backdropRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!backdropRef.current) return;

    gsap.to(backdropRef.current, {
      opacity: isOpen ? 1 : 0,
      duration: isOpen ? 0.24 : 0.2,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  }, [isOpen]);

  return (
    <div
      ref={(node) => {
        backdropRef.current = node;
        assignRef(ref, node);
      }}
      onClick={onClick || onClose}
      className={cn('fixed inset-0 z-[100] cursor-pointer bg-black/60 opacity-0', className)}
      {...props}
    />
  );
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>;
  variant?: 'center' | 'drawer';
  dragToDismiss?: boolean;
}

function DialogContent({
  children,
  className,
  variant = 'drawer',
  dragToDismiss = true,
  ref,
  ...props
}: DialogContentProps) {
  const { onClose, isOpen } = useDialog();
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const startYRef = React.useRef(0);
  const currentYRef = React.useRef(0);
  const isDraggingRef = React.useRef(false);

  React.useEffect(() => {
    if (!contentRef.current) return;

    if (variant === 'drawer') {
      gsap.to(contentRef.current, {
        y: isOpen ? 0 : '100%',
        duration: isOpen ? 0.38 : 0.26,
        ease: isOpen ? 'power3.out' : 'power2.in',
        force3D: true,
        overwrite: 'auto',
      });
      return;
    }

    gsap.to(contentRef.current, {
      opacity: isOpen ? 1 : 0,
      scale: isOpen ? 1 : 0.96,
      duration: 0.22,
      ease: isOpen ? 'power2.out' : 'power2.in',
      force3D: true,
      overwrite: 'auto',
    });
  }, [isOpen, variant]);

  const handleDragStart = (clientY: number) => {
    if (!dragToDismiss || variant !== 'drawer') return;
    startYRef.current = clientY;
    currentYRef.current = 0;
    isDraggingRef.current = true;
    gsap.killTweensOf(contentRef.current);
  };

  const handleDragMove = (clientY: number) => {
    if (!isDraggingRef.current || !contentRef.current) return;

    const offset = Math.max(0, clientY - startYRef.current);
    currentYRef.current = offset;
    gsap.set(contentRef.current, { y: offset, force3D: true });
  };

  const handleDragEnd = () => {
    if (!isDraggingRef.current || !contentRef.current) return;
    isDraggingRef.current = false;

    if (currentYRef.current > 75) {
      gsap.to(contentRef.current, {
        y: '100%',
        duration: 0.24,
        ease: 'power2.in',
        overwrite: 'auto',
        onComplete: onClose,
      });
      return;
    }

    gsap.to(contentRef.current, {
      y: 0,
      duration: 0.24,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  };

  const setContentRef = (node: HTMLDivElement | null) => {
    contentRef.current = node;
    assignRef(ref, node);
  };

  if (variant === 'drawer') {
    return (
      <div
        ref={setContentRef}
        onTouchStart={(event) => handleDragStart(event.touches[0].clientY)}
        onTouchMove={(event) => handleDragMove(event.touches[0].clientY)}
        onTouchEnd={handleDragEnd}
        onMouseDown={(event) => handleDragStart(event.clientY)}
        onMouseMove={(event) => {
          if (event.buttons === 1) handleDragMove(event.clientY);
        }}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[100] mx-auto w-full max-w-md cursor-grab rounded-t-[28px] border-t border-zinc-200 bg-white pb-10 text-right font-sans shadow-[0_-8px_30px_rgba(0,0,0,0.12)] active:cursor-grabbing',
          className
        )}
        onClick={(event) => event.stopPropagation()}
        {...props}
      >
        {dragToDismiss ? <div className="mx-auto my-3.5 h-1 w-12 rounded-full bg-zinc-200" /> : null}
        {children}
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        ref={setContentRef}
        className={cn('pointer-events-auto w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-6 opacity-0 shadow-xl', className)}
        onClick={(event) => event.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

interface DialogCloseProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>;
}

function DialogClose({ children, className, onClick, ref, ...props }: DialogCloseProps) {
  const { onClose } = useDialog();

  return (
    <div
      ref={ref}
      onClick={(event) => {
        onClose();
        onClick?.(event);
      }}
      className={cn('cursor-pointer', className)}
      {...props}
    >
      {children}
    </div>
  );
}

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
);

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  ref?: React.Ref<HTMLHeadingElement>;
}

function DialogTitle({ className, ref, ...props }: DialogTitleProps) {
  return <h3 ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />;
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  ref?: React.Ref<HTMLParagraphElement>;
}

function DialogDescription({ className, ref, ...props }: DialogDescriptionProps) {
  return <p ref={ref} className={cn('text-sm text-zinc-500', className)} {...props} />;
}

const Dialog = DialogRoot as typeof DialogRoot & {
  Root: typeof DialogRoot;
  Portal: typeof DialogPortal;
  Backdrop: typeof DialogOverlay;
  Content: typeof DialogContent;
  Close: typeof DialogClose;
};

Dialog.Root = DialogRoot;
Dialog.Portal = DialogPortal;
Dialog.Backdrop = DialogOverlay;
Dialog.Content = DialogContent;
Dialog.Close = DialogClose;

export {
  Dialog,
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
