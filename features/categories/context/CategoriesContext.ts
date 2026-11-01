import { createContext, use } from 'react';
import type { CategoryNode } from '../types';

export interface CategoriesState {
    roots: CategoryNode[];
    activeParent: CategoryNode | null;
    subcategories: CategoryNode[];
    isPending: boolean;
    isError: boolean;
}

export interface CategoriesActions {
    selectParent: (parent: CategoryNode) => void;
    selectSubcategory: (subcategory: CategoryNode) => void;
    selectViewAll: () => void;
}

export interface CategoriesContextValue {
    state: CategoriesState;
    actions: CategoriesActions;
}

export const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function useCategories(): CategoriesContextValue {
    const value = use(CategoriesContext);
    if (!value) {
        throw new Error('useCategories must be used inside <Categories.Root>');
    }
    return value;
}
