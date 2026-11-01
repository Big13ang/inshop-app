'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CategoriesContext, type CategoriesContextValue } from '../context/CategoriesContext';
import { useCategoryTree } from '../services/categoriesService';
import type { CategoryNode } from '../types';
import { getActiveChildren, getActiveRoots } from '../utils/categoryTree';

function buildFeedHref(parent: CategoryNode, subcategoryId?: string): string {
    const params = new URLSearchParams([['cat', parent.id]]);
    if (subcategoryId) {
        params.set('subcat', subcategoryId);
    }
    return `/?${params.toString()}`;
}

export function CategoriesRoot({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { data: categories = [], isPending, isError } = useCategoryTree();
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

    const roots = getActiveRoots(categories);
    const activeParent = roots.find((root) => root.id === selectedParentId) ?? roots[0] ?? null;
    const subcategories = activeParent ? getActiveChildren(categories, activeParent.id) : [];

    function handleSelectParent(parent: CategoryNode) {
        setSelectedParentId(parent.id);
    }

    function handleSelectSubcategory(subcategory: CategoryNode) {
        if (!activeParent) return;
        router.push(buildFeedHref(activeParent, subcategory.id));
    }

    function handleSelectViewAll() {
        if (!activeParent) return;
        router.push(buildFeedHref(activeParent));
    }

    const value: CategoriesContextValue = {
        state: { roots, activeParent, subcategories, isPending, isError },
        actions: {
            selectParent: handleSelectParent,
            selectSubcategory: handleSelectSubcategory,
            selectViewAll: handleSelectViewAll,
        },
    };

    return <CategoriesContext value={value}>{children}</CategoriesContext>;
}
