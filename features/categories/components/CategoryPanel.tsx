'use client';

import {
    Armchair,
    Baby,
    Bed,
    Bike,
    BookOpen,
    Boxes,
    Camera,
    Car,
    CircleDot,
    Coffee,
    Coins,
    Compass,
    Cookie,
    Crown,
    Droplets,
    Dumbbell,
    Flame,
    Footprints,
    Gem,
    Glasses,
    Hammer,
    Headphones,
    Keyboard,
    Lamp,
    Laptop,
    Luggage,
    Milk,
    Package,
    Palette,
    PenTool,
    Radio,
    Scissors,
    ShieldCheck,
    Shirt,
    ShoppingBag,
    Smartphone,
    Sparkles,
    Tablet,
    Utensils,
    UtensilsCrossed,
    Volume2,
    Watch,
    Wrench,
    Zap,
    type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CATEGORIES_TEXT } from '../constants';
import { useCategories } from '../context/CategoriesContext';
import type { SubCategory, SubIconName } from '../types';

const SUBCATEGORY_ICON_MAP: Record<SubIconName, LucideIcon> = {
    Armchair,
    Baby,
    Bed,
    Bike,
    BookOpen,
    Boxes,
    Camera,
    Car,
    CircleDot,
    Coffee,
    Coins,
    Compass,
    Cookie,
    Crown,
    Droplets,
    Dumbbell,
    Flame,
    Footprints,
    Gem,
    Glasses,
    Hammer,
    Headphones,
    Keyboard,
    Lamp,
    Laptop,
    Luggage,
    Milk,
    Package,
    Palette,
    PenTool,
    Radio,
    Scissors,
    ShieldCheck,
    Shirt,
    ShoppingBag,
    Smartphone,
    Sparkles,
    Tablet,
    Utensils,
    UtensilsCrossed,
    Volume2,
    Watch,
    Wrench,
    Zap,
};

function SubcategoryItem({ subcategory }: { subcategory: SubCategory }) {
    const { state, actions } = useCategories();
    const Icon = SUBCATEGORY_ICON_MAP[subcategory.iconName];

    return (
        <Button
            variant="ghost"
            onClick={() => actions.selectSubcategory(state.activeParent, subcategory)}
            className="h-auto w-full justify-start gap-3 whitespace-normal rounded-xl px-2 py-3 text-start font-medium"
        >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-container-base text-secondary">
                <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="text-xs leading-relaxed text-foreground">{subcategory.title}</span>
        </Button>
    );
}

// Keyed by parent id in CategoryPanel, so switching parents remounts the list and resets its scroll position.
function PanelList() {
    const { state, actions } = useCategories();
    const { activeParent } = state;

    return (
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto no-scrollbar bg-background px-4 py-3.5">
            <header className="mb-2 flex shrink-0 items-center justify-between border-b border-primary/5 pb-3">
                <h2 className="text-sm font-bold text-primary">{activeParent.title}</h2>
                <Button variant="secondary" size="sm" onClick={() => actions.selectViewAll(activeParent)}>
                    {CATEGORIES_TEXT.viewAll}
                </Button>
            </header>
            <ul className="flex flex-col divide-y divide-primary/5">
                {activeParent.subcategories.map((subcategory) => (
                    <li key={subcategory.id}>
                        <SubcategoryItem subcategory={subcategory} />
                    </li>
                ))}
            </ul>
        </section>
    );
}

export function CategoryPanel() {
    const { state } = useCategories();
    return <PanelList key={state.activeParent.id} />;
}
