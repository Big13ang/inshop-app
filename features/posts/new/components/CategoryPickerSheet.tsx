'use client';

import { useState } from 'react';
import { Drawer } from 'vaul';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getActiveChildren, getActiveRoots } from '@/features/categories/utils/categoryTree';
import type { CategoryNode } from '@/features/categories/types';
import { text } from '../constants';
import { hasSelectableBranch } from '../utils/categoryPath';
import { CategoryPickerHeader } from './CategoryPickerHeader';
import { CategoryPickerList } from './CategoryPickerList';

interface CategoryPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryNode[];
  selectedId: string;
  isError: boolean;
  onRetry: () => void;
  onSelect: (id: string) => void;
}

// One sheet, two steps: pick a category, then (if it has sub-categories) one of its children.
export function CategoryPickerSheet({
  open,
  onOpenChange,
  categories,
  selectedId,
  isError,
  onRetry,
  onSelect,
}: CategoryPickerSheetProps) {
  const [parentId, setParentId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const parent = parentId ? categories.find((node) => node.id === parentId) : undefined;
  const levelNodes = parentId ? getActiveChildren(categories, parentId) : getActiveRoots(categories);
  const visibleNodes = levelNodes.filter(
    (node) => hasSelectableBranch(categories, node) && node.name.includes(search.trim()),
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setParentId(null);
      setSearch('');
    }
    onOpenChange(nextOpen);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const handleBack = () => {
    setParentId(parent?.parentId ?? null);
    setSearch('');
  };

  const handleNodeClick = (node: CategoryNode) => {
    if (getActiveChildren(categories, node.id).length > 0) {
      setParentId(node.id);
      setSearch('');
      return;
    }
    onSelect(node.id);
    handleOpenChange(false);
  };

  return (
    <Drawer.Root open={open} onOpenChange={handleOpenChange} shouldScaleBackground>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[200] bg-black/40" />
        <Drawer.Content
          className="pointer-events-none fixed bottom-0 left-0 right-0 z-[201] flex justify-center focus:outline-none"
          dir="rtl"
        >
          <div className="pointer-events-auto flex w-full flex-col overflow-hidden rounded-t-[2rem] bg-white p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl md:max-w-app">
            <div className="mx-auto mb-4 h-1.5 w-12 shrink-0 rounded-full bg-stone-200" />
            <CategoryPickerHeader title={parent?.name ?? text.categorySheetTitle} onBack={parent ? handleBack : undefined} />

            <div className="mb-4 flex shrink-0 items-center rounded-2xl bg-stone-50 px-3">
              <Search className="h-5 w-5 shrink-0 text-stone-400" />
              <Input
                value={search}
                onChange={handleSearchChange}
                placeholder={text.categorySearchPlaceholder}
                className="h-14 border-0 bg-transparent px-0 pr-2 shadow-none focus:shadow-none"
              />
            </div>

            <CategoryPickerList
              categories={categories}
              nodes={visibleNodes}
              selectedId={selectedId}
              isError={isError}
              onRetry={onRetry}
              onSelect={handleNodeClick}
            />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
