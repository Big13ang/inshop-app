import type { CategoryNode } from '../types';

export function getActiveRoots(categories: CategoryNode[]): CategoryNode[] {
    return categories.filter((node) => node.parentId === null && node.isActive);
}

export function getActiveChildren(categories: CategoryNode[], parentId: string): CategoryNode[] {
    return categories.filter((node) => node.parentId === parentId && node.isActive);
}
