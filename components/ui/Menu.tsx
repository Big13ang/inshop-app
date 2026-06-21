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

function MenuTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between border-b border-zinc-100 px-5 pb-4 select-none" dir="rtl">
      <span className="text-[13px] font-bold text-zinc-500">{children}</span>
      {right ? <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-500">{right}</span> : null}
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
      className="tap-card flex w-full cursor-pointer items-center justify-between px-5 py-4 transition-colors hover:bg-zinc-50"
      dir="rtl"
    >
      <div className="flex items-center gap-3">
        <span className={cn('text-zinc-500', tone === 'danger' && 'text-red-500')}>{icon}</span>
        <span className={cn('text-xs font-semibold text-zinc-900', tone === 'danger' && 'text-red-600')}>
          {label}
        </span>
      </div>
      {hint ? <span className="text-[10px] font-medium text-zinc-400">{hint}</span> : null}
    </button>
  );
}

export const Menu = {
  Root: MenuRoot,
  Title: MenuTitle,
  Item: MenuItem,
};
