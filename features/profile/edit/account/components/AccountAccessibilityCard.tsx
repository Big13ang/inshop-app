'use client';

import { ReactNode } from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export interface AccountAccessibilityCardProps {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function AccountAccessibilityCard({
  id,
  title,
  description,
  icon,
  checked,
  onToggle,
  disabled = false,
}: AccountAccessibilityCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  const handleCardClick = () => {
    if (!disabled) {
      onToggle();
    }
  };

  return (
    <div
      id={id}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex items-center justify-between p-3 rounded-xl border transition-all select-none active:scale-[0.99]',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        checked
          ? 'bg-surface-l1 border-container-active shadow-xs'
          : 'bg-surface border-container-base hover:bg-surface-l1/60'
      )}
    >
      <div className="flex items-center gap-2.5 pointer-events-none">
        <div
          className={cn(
            'size-7 rounded-lg border flex items-center justify-center shrink-0 transition-colors',
            checked
              ? 'bg-primary text-on-primary border-primary'
              : 'bg-container-base text-secondary border-container-base'
          )}
        >
          {icon}
        </div>
        <div>
          <span className="text-xs font-bold text-primary block">
            {title}
          </span>
          <span className="text-[10px] text-secondary block mt-0.5">
            {description}
          </span>
        </div>
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <Switch
          checked={checked}
          onCheckedChange={onToggle}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
