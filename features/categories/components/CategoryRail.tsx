'use client';

import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCategories } from '../context/CategoriesContext';
import type { CategoryNode } from '../types';

function RailItem({ parent }: { parent: CategoryNode }) {
    const { state, actions } = useCategories();
    const isActive = state.activeParent?.id === parent.id;

    return (
        <Button
            variant="ghost"
            aria-pressed={isActive}
            onClick={() => actions.selectParent(parent)}
            className={cn(
                'h-auto w-full flex-col gap-1.5 whitespace-normal rounded-xl px-1 py-2.5 text-center',
                isActive && 'bg-surface-l3 shadow-xs',
            )}
        >
            <span
                className={cn(
                    'flex size-10 items-center justify-center rounded-2xl transition-colors',
                    isActive ? 'bg-primary text-on-primary' : 'bg-container-base text-secondary',
                )}
            >
                <ShoppingBag className="size-5" strokeWidth={isActive ? 2.2 : 1.75} aria-hidden="true" />
            </span>
            <span
                className={cn(
                    'line-clamp-2 text-[11px] leading-tight',
                    isActive ? 'font-bold text-primary' : 'font-medium text-secondary',
                )}
            >
                {parent.name}
            </span>
        </Button>
    );
}

export function CategoryRail() {
    const { state } = useCategories();

    return (
        <aside className="w-23 shrink-0 overflow-y-auto no-scrollbar border-e border-primary/5 bg-surface-l1 py-2">
            <ul className="flex flex-col gap-1 px-1">
                {state.roots.map((parent) => (
                    <li key={parent.id}>
                        <RailItem parent={parent} />
                    </li>
                ))}
            </ul>
        </aside>
    );
}
