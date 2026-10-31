'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES } from '../data';
import { CategoriesContext, type CategoriesContextValue } from '../context/CategoriesContext';
import type { ParentCategory } from '../types';

function buildFeedHref(parent: ParentCategory, query: string, subcategoryId?: string): string {
    const params = new URLSearchParams([['cat', parent.id]]);
    if (subcategoryId) {
        params.set('subcat', subcategoryId);
    }
    params.set('q', query);
    return `/?${params.toString()}`;
}

export function CategoriesRoot({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [activeParent, setActiveParent] = useState<ParentCategory>(CATEGORIES[0]);

    const value: CategoriesContextValue = {
        state: { activeParent },
        actions: {
            selectParent: setActiveParent,
            selectSubcategory: (parent, subcategory) =>
                router.push(buildFeedHref(parent, subcategory.searchQuery, subcategory.id)),
            selectViewAll: (parent) =>
                router.push(buildFeedHref(parent, parent.subcategories[0]?.searchQuery ?? parent.title)),
        },
    };

    return <CategoriesContext value={value}>{children}</CategoriesContext>;
}
