'use client';

import Link from 'next/link';
import { HomeIcon } from '@/components/icons/HomeIcon';
import Header from '@/components/layout/Header';
import MainFooter from '@/components/layout/MainFooter';
import { Button } from '@/components/ui/button';
import { Post } from '@/features/posts/components/Post';
import type { BasePostData } from '@/features/posts/components/Post/types';
import { usePublicPostById, type PublicPost } from '@/features/posts/services/publicPostService';
import PublicPostMenuDrawer from './components/PublicPostMenuDrawer';

interface Props {
  postId: string;
  initialPost?: PublicPost | null;
}

export default function PublicPostView({ postId, initialPost }: Props) {
  const { data: post, isLoading } = usePublicPostById(postId, initialPost);

  if (isLoading && !post) {
    return (
      <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background" dir="rtl">
        <Header.Root>
          <Header.Back id="public-post-back-btn" />
          <Header.Title>پست</Header.Title>
          <Header.Right />
        </Header.Root>

        <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="size-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </main>

        <MainFooter />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background" dir="rtl">
        <Header.Root>
          <Header.Back id="public-post-back-btn" />
          <Header.Title>پست</Header.Title>
          <Header.Right />
        </Header.Root>

        <main className="relative flex-1 flex flex-col justify-between h-full px-6 py-12 select-none overflow-hidden bg-background text-foreground" dir="rtl">
          {/* Top spacing */}
          <div className="h-6" />

          {/* Center content container matching 404 page */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto gap-6">
            <div className="flex flex-col items-center gap-4">
              {/* Brand Logo */}
              <span className="font-logo font-extrabold text-5xl text-black select-none">
                inShop
              </span>

              {/* Display text */}
              <h1 className="text-7xl font-black font-logo tracking-tighter text-black select-none leading-none">
                404
              </h1>

              {/* Status pill */}
              <div className="px-3 py-1 bg-zinc-950 text-white rounded-full text-[10px] font-extrabold tracking-wider uppercase select-none">
                POST NOT FOUND
              </div>
            </div>

            {/* Persian notification */}
            <div className="flex flex-col gap-2 mt-2">
              <h2 className="text-xl font-black text-black">
                پست مورد نظر وجود ندارد
              </h2>
              <p className="text-xs text-zinc-800 font-medium leading-relaxed px-4">
                ممکن است این پست حذف شده باشد یا آدرس آن را به اشتباه وارد کرده باشید.
              </p>
            </div>
          </div>

          {/* Bottom Action CTA */}
          <div className="relative z-10 w-full max-w-xs mx-auto flex flex-col items-center gap-4 mt-auto">
            <Link href="/" className="w-full">
              <Button
                id="btn-home-not-found"
                variant="filled"
                size="xl"
                className="w-full flex items-center justify-center gap-2"
              >
                <HomeIcon className="size-4" />
                صفحه اصلی
              </Button>
            </Link>
          </div>
        </main>

        <MainFooter />
      </div>
    );
  }

  const shopHref = post.shop.username ? `/@${post.shop.username}` : '#';

  const basePostData: BasePostData = {
    id: post.id,
    description: post.description,
    media: post.media,
    createdAt: post.publishedAt,
    sellerName: post.shop.shopName,
    sellerAvatar: post.shop.profilePhotoUrl || '',
    isVerified: false,
  };

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background" dir="rtl">
      <Header.Root>
        <Header.Back id="public-post-back-btn" />
        <Header.Title>پست</Header.Title>
        <Header.Right />
      </Header.Root>

      <main className="hide-scrollbar flex-1 overflow-y-auto bg-background pb-20">
        <div className="flex flex-col">
          <Post.Provider post={basePostData}>
            <Post.Root>
              <Post.Header>
                <Post.HeaderInfo>
                  <Link href={shopHref} className="flex items-center gap-3">
                    <Post.Avatar />
                    <Post.AuthorBlock>
                      <Post.AuthorNameRow>
                        <Post.AuthorName />
                        <Post.VerifiedBadge />
                      </Post.AuthorNameRow>
                      <Post.Timestamp />
                    </Post.AuthorBlock>
                  </Link>
                </Post.HeaderInfo>

                <Post.MenuButton />
              </Post.Header>

              <Post.Media />

              <Post.Body>
                <Link href={shopHref}>
                  <Post.AuthorName className="mb-1 inline-block cursor-pointer hover:underline" />
                </Link>
                <Post.Caption />
              </Post.Body>
            </Post.Root>

            <PublicPostMenuDrawer post={post} />
          </Post.Provider>
        </div>
      </main>

      <MainFooter />
    </div>
  );
}

