import Feed from '@/features/feed/components/Feed';
import MainFooter from '@/components/layout/MainFooter';

export default function Home() {
  return (
    <main className="w-full h-screen max-w-md mx-auto bg-background overflow-hidden relative flex flex-col">
      <div className="flex-1 overflow-hidden relative pb-16">
        <Feed />
      </div>
      <MainFooter />
    </main>
  );
}
