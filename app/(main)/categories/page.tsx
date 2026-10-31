import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import MainFooter from '@/components/layout/MainFooter';
import { Categories } from '@/features/categories/components/Categories';
import { CATEGORIES_TEXT } from '@/features/categories/constants';

export const metadata: Metadata = {
    title: CATEGORIES_TEXT.title,
};

export default function CategoriesPage() {
    return (
        <main className="w-full h-screen max-w-md mx-auto bg-background overflow-hidden relative flex flex-col">
            <Categories.Root>
                <Header.Root>
                    <Header.Back />
                    <Header.Title>{CATEGORIES_TEXT.title}</Header.Title>
                    <Header.Right />
                </Header.Root>
                <div className="flex flex-1 min-h-0 overflow-hidden pb-16">
                    <Categories.Rail />
                    <Categories.Panel />
                </div>
            </Categories.Root>
            <MainFooter />
        </main>
    );
}
