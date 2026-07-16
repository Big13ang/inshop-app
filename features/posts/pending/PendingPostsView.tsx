'use client';

import { useState } from 'react';
import { Hourglass, Trash2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import MainFooter from '@/components/layout/MainFooter';
import { Menu } from '@/components/ui/Menu';
import { Button } from '@/components/ui/button';
import { postsQueryService, POST_STATUS } from '../services/postsQueryService';
import PendingPostCard from './components/PendingPostCard';
import { text } from './constants';

interface PendingPostsViewProps {
  onBack: () => void;
  onAddPost: () => void;
}

export default function PendingPostsView({ onBack, onAddPost }: PendingPostsViewProps) {
  const { data: posts = [] } = postsQueryService.usePendingPosts();
  const deletePost = postsQueryService.useDeletePendingPost();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const activePost = posts.find((post) => post.id === activeMenuId);

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background" dir="rtl">
      <Header.Root>
        <Header.Back onClick={onBack} id="pending-back-btn" />
        <Header.Title>{`${text.headerTitle} (${posts.length})`}</Header.Title>
        <Header.Right />
      </Header.Root>

      <main className="hide-scrollbar flex-1 overflow-y-auto bg-background pb-20">
        <div className="border-b border-primary/5 bg-surface-container-low px-4 py-3 text-right">
          <p className="text-[11px] leading-5 text-zinc-500">{text.noticeText}</p>
        </div>

        {posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center" dir="rtl">
            <Hourglass className="h-10 w-10 text-zinc-300" />
            <h3 className="text-sm font-bold text-primary">{text.emptyTitle}</h3>
            <p className="text-xs text-zinc-500">{text.emptyDescription}</p>
            <Button onClick={onAddPost}>{text.emptyActionLabel}</Button>
          </div>
        ) : (
          <div className="flex flex-col">
            {posts.map((post) => (
              <PendingPostCard key={post.id} post={post} onOpenMenu={setActiveMenuId} />
            ))}
          </div>
        )}
      </main>

      <MainFooter />

      <Menu.Root isOpen={activeMenuId !== null} onClose={() => setActiveMenuId(null)}>
        <Menu.Title right={activePost?.status === POST_STATUS.REJECTED ? text.statusRejectedShort : text.statusPending}>
          {text.menuTitle}
        </Menu.Title>
        <Menu.Item
          icon={<Trash2 className="h-4 w-4" />}
          label={text.deleteLabel}
          hint={text.deleteHint}
          onClick={() => {
            if (activeMenuId) deletePost.mutate(activeMenuId);
            setActiveMenuId(null);
          }}
        />
      </Menu.Root>
    </div>
  );
}
