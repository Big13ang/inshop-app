'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCategoryTree } from '@/features/categories/services/categoriesService';
import type { CategoryNode } from '@/features/categories/types';
import { text } from '../constants';
import { useMediaStore } from '../services/mediaStore';
import { getCategoryPath } from '../utils/categoryPath';
import { CategoryPickerSheet } from './CategoryPickerSheet';

export function PostCategoryField() {
  const category = useMediaStore((s) => s.category);
  const setCategory = useMediaStore((s) => s.setCategory);
  const { data: categories = [], isPending, isError, refetch } = useCategoryTree();
  const [isOpen, setIsOpen] = useState(false);

  const selectedPath = category ? getCategoryPath(categories, category) : [];

  const handleTriggerClick = () => setIsOpen(true);
  const handleRetry = () => refetch();

  return (
    <div className="flex flex-col gap-2">
      <span id="post-category-label" className="font-bold text-xs text-secondary pr-1">
        {text.categoryLabel}
      </span>

      <Button
        type="button"
        variant="ghost"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-labelledby="post-category-label"
        disabled={isPending}
        onClick={handleTriggerClick}
        className={cn(
          'h-14 w-full justify-between rounded-2xl border border-outline bg-white px-4 text-base font-medium',
          selectedPath.length === 0 && 'text-stone-400',
        )}
      >
        <CategoryBreadcrumb path={selectedPath} />
        <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-40" />
      </Button>

      <CategoryPickerSheet
        open={isOpen}
        onOpenChange={setIsOpen}
        categories={categories}
        selectedId={category}
        isError={isError}
        onRetry={handleRetry}
        onSelect={setCategory}
      />
    </div>
  );
}

function CategoryBreadcrumb({ path }: { path: CategoryNode[] }) {
  if (path.length === 0) {
    return <span className="truncate">{text.categoryPlaceholder}</span>;
  }

  return (
    <span className="flex min-w-0 items-center gap-1">
      {path.map((node, index) => (
        <span key={node.id} className="flex min-w-0 items-center gap-1">
          {index > 0 ? <ChevronLeft className="h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" /> : null}
          <span
            className={cn(
              'truncate rounded-full px-3 py-1 text-sm',
              index === path.length - 1 ? 'bg-primary font-bold text-on-primary' : 'bg-stone-100 text-stone-600',
            )}
          >
            {node.name}
          </span>
        </span>
      ))}
    </span>
  );
}
