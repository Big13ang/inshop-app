'use client';

import Link from 'next/link';
import { Clock, AlertOctagon } from 'lucide-react';
import { toast } from 'sonner';
import { Post, usePostContext } from '@/features/posts/components/Post';
import type { BasePostData } from '@/features/posts/components/Post/types';
import { useUser } from '@/features/profile/context/UserContext';
import { text } from '../constants';
import RejectionOverlay from './RejectionOverlay';
import type { PendingPost } from '../types';
import { POST_STATUS } from '../../services/postsQueryService';

interface PendingPostCardProps {
  post: PendingPost;
  onOpenMenu: (id: string) => void;
}

function PendingStatusOverlay({ status, rejectReason }: { status: PendingPost['status']; rejectReason?: string | null }) {
  const { state, actions } = usePostContext();
  const isRejected = status === POST_STATUS.REJECTED;

  return (
    <>
      {isRejected && !state.isOverlayDismissed && rejectReason ? (
        <RejectionOverlay
          rejectionReason={rejectReason}
          onDismiss={() => {
            actions.dismissOverlay();
            toast.info(text.rejectionDismissedToast);
          }}
        />
      ) : null}

      {isRejected ? (
        <Post.StatusBadge
          icon={<AlertOctagon className="h-3.5 w-3.5 text-zinc-300" />}
          className="border-zinc-700/60 text-[10px]"
          onClick={actions.restoreOverlay}
        >
          {text.statusRejected}
        </Post.StatusBadge>
      ) : (
        <Post.StatusBadge icon={<Clock className="h-3.5 w-3.5" />}>{text.statusPending}</Post.StatusBadge>
      )}
    </>
  );
}

export default function PendingPostCard({ post, onOpenMenu }: PendingPostCardProps) {
  let user = null;
  try {
    const userCtx = useUser();
    user = userCtx.user;
  } catch {
    // Rendered outside UserProvider in unit tests
  }

  const sellerName = post.sellerName || user?.sellerProfile?.shopName || '';
  const basePostData: BasePostData = {
    id: post.id,
    description: post.description,
    media: post.media,
    createdAt: post.createdAt,
    sellerName,
    sellerAvatar: post.sellerAvatar || user?.sellerProfile?.profilePhotoUrl || '',
    isVerified: post.isVerified ?? !!user?.isVerifiedSeller,
  };

  return (
    <Post.Provider post={basePostData} onOpenMenu={onOpenMenu}>
      <Post.Root>
        {/* TODO: Username should be added after the API update */}
        <Post.Header>
          <Post.HeaderInfo>
            <Link href={`/username_should_be_added`} className="flex items-center gap-3">
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

        <Post.Media>
          <PendingStatusOverlay status={post.status} rejectReason={post.rejectReason} />
        </Post.Media>

        <Post.Body>
          <Link href={`/${post.sellerId}`}>
            <Post.AuthorName className="mb-1 inline-block cursor-pointer hover:underline" />
          </Link>
          <Post.Caption />
        </Post.Body>
      </Post.Root>
    </Post.Provider>
  );
}
