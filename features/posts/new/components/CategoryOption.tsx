import { Check, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CategoryNode } from '@/features/categories/types';

interface CategoryOptionProps {
  node: CategoryNode;
  isSelected: boolean;
  hasChildren: boolean;
  onSelect: (node: CategoryNode) => void;
}

export function CategoryOption({ node, isSelected, hasChildren, onSelect }: CategoryOptionProps) {
  const handleClick = () => onSelect(node);

  return (
    <Button
      type="button"
      variant="ghost"
      role="option"
      aria-selected={isSelected}
      onClick={handleClick}
      className={cn(
        'mb-1 h-auto w-full justify-between rounded-xl px-4 py-4 text-right text-base font-medium',
        isSelected ? 'bg-surface-l1 text-primary' : 'text-stone-600',
      )}
    >
      <span className="flex-1">{node.name}</span>
      {hasChildren ? <ChevronLeft className="h-5 w-5 opacity-50" /> : null}
      {isSelected ? <Check className="h-5 w-5" /> : null}
    </Button>
  );
}
