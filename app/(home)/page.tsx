import { Feed } from '@/features/feed/components/Feed';
import MainFooter from '@/components/layout/MainFooter';
import { SplashScreen } from '@/components/ui/SplashScreen';

export default function Home() {
  return (
    <>
      <SplashScreen />
      <main className="w-full h-screen max-w-md mx-auto bg-background overflow-hidden relative flex flex-col">
        <div className="flex-1 overflow-hidden relative pb-16">
          <Feed />
        </div>
        <MainFooter />
      </main>
    </>
  );
}

