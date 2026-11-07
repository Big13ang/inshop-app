'use client';

import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CATEGORIES_TEXT } from '../constants';
import { useCategories } from '../context/CategoriesContext';
import type { CategoryNode } from '../types';

function SubcategoryItem({ subcategory }: { subcategory: CategoryNode }) {
    const { actions } = useCategories();

    return (
        <Button
            variant="ghost"
            onClick={() => actions.selectSubcategory(subcategory)}
            className="h-auto w-full justify-start gap-3 whitespace-normal rounded-xl px-2 py-3 text-start font-medium"
        >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-container-base text-secondary">
                <Package className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="text-xs leading-relaxed text-foreground">{subcategory.name}</span>
        </Button>
    );
}

// Keyed by parent id in CategoryPanel, so switching parents remounts the list and resets its scroll position.
function PanelList({ parent }: { parent: CategoryNode }) {
    const { state, actions } = useCategories();

    return (
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto no-scrollbar bg-background px-4 py-3.5">
            <header className="mb-2 flex shrink-0 items-center justify-between border-b border-primary/5 pb-3">
                <h2 className="text-sm font-bold text-primary">{parent.name}</h2>
                <Button variant="secondary" size="sm" onClick={actions.selectViewAll}>
                    {CATEGORIES_TEXT.viewAll}
                </Button>
            </header>
            <ul className="flex flex-col divide-y divide-primary/5">
                {state.subcategories.map((subcategory) => (
                    <li key={subcategory.id}>
                        <SubcategoryItem subcategory={subcategory} />
                    </li>
                ))}
            </ul>
        </section>
    );
}

function PanelMessage({ text }: { text: string }) {
    return (
        <section className="flex min-h-0 min-w-0 flex-1 items-center justify-center bg-background px-4 py-3.5">
            <p className="text-center text-xs text-secondary">{text}</p>
        </section>
    );
}

export function CategoryPanel() {
    const { state } = useCategories();

    if (state.isPending) {
        return <PanelMessage text={CATEGORIES_TEXT.loading} />;
    }
    if (state.isError) {
        return <PanelMessage text={CATEGORIES_TEXT.error} />;
    }
    if (!state.activeParent) {
        return <PanelMessage text={CATEGORIES_TEXT.empty} />;
    }
    return <PanelList key={state.activeParent.id} parent={state.activeParent} />;
}
