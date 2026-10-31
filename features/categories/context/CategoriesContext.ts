import { createContext, use } from 'react';
import type { ParentCategory, SubCategory } from '../types';

export interface CategoriesState {
    activeParent: ParentCategory;
}

export interface CategoriesActions {
    selectParent: (parent: ParentCategory) => void;
    selectSubcategory: (parent: ParentCategory, subcategory: SubCategory) => void;
    selectViewAll: (parent: ParentCategory) => void;
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
