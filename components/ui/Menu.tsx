import { Dialog } from './Dialog';
import { cn } from '@/lib/utils';

interface MenuRootProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function MenuRoot({ isOpen, onClose, children }: MenuRootProps) {
  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content variant="drawer" className="pb-10 pt-1">
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface MenuTitleProps {
  children: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

function MenuTitle({ children, right, className }: MenuTitleProps) {
  return (
    <div className={cn('relative mb-3 flex items-center justify-center border-b border-primary/10 px-6 py-6 text-center select-none', className)} dir="rtl">
      <span className="w-full text-center text-sm font-bold text-foreground leading-tight px-12">{children}</span>
      {right ? (
        <span className="absolute left-6 rounded-full bg-secondary/80 px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
          {right}
        </span>
      ) : null}
    </div>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
}

function MenuItem({ icon, label, hint, onClick, tone = 'default' }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="tap-card flex w-full cursor-pointer items-center justify-between px-6 py-4 transition-colors hover:bg-accent/60 active:bg-accent"
      dir="rtl"
    >
      <div className="flex items-center gap-3.5">
        <span className={cn('flex size-5 shrink-0 items-center justify-center text-secondary', tone === 'danger' && 'text-error')}>
          {icon}
        </span>
        <span className={cn('text-sm font-medium leading-none text-foreground', tone === 'danger' && 'text-error font-semibold')}>
          {label}
        </span>
      </div>
      {hint ? <span className={cn('text-xs text-secondary/80', tone === 'danger' && 'text-error/80')}>{hint}</span> : null}
    </button>
  );
}

export const Menu = {
  Root: MenuRoot,
  Title: MenuTitle,
  Item: MenuItem,
};
