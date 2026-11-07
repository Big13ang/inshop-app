import MainFooter from '@/components/layout/MainFooter';
import { CategoryPosts } from '@/features/categories/components/CategoryPosts';

export default function CategoryPostsPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <main className="w-full h-screen max-w-md mx-auto bg-background overflow-hidden relative flex flex-col">
            <CategoryPosts params={params} />
            <MainFooter />
        </main>
    );
}
