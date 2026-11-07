import { getActiveChildren } from '@/features/categories/utils/categoryTree';
import type { CategoryNode } from '@/features/categories/types';

// Returns the chain from the root category down to the category with the given id.
export function getCategoryPath(categories: CategoryNode[], id: string): CategoryNode[] {
  const path: CategoryNode[] = [];
  let current = categories.find((node) => node.id === id);
  while (current) {
    path.unshift(current);
    const parentId: string | null = current.parentId;
    current = parentId ? categories.find((node) => node.id === parentId) : undefined;
  }
  return path;
}

// A category is only worth showing if it, or something beneath it, can actually be picked.
export function hasSelectableBranch(categories: CategoryNode[], node: CategoryNode): boolean {
  if (node.selectable) return true;
  return getActiveChildren(categories, node.id).some((child) => hasSelectableBranch(categories, child));
}
