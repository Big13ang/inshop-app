'use client';

import { Clock, AlertOctagon } from 'lucide-react';
import { toast } from 'sonner';
import { Post, usePostContext } from '@/features/posts/components/Post';
import { text } from '../constants';
import RejectionOverlay from './RejectionOverlay';
import type { PendingPost } from '../types';

interface PendingPostCardProps {
  post: PendingPost;
  onOpenMenu: (id: string) => void;
}

function PendingStatusOverlay({ status, rejectionReason }: { status: PendingPost['status']; rejectionReason?: string }) {
  const { state, actions } = usePostContext();
  const isRejected = status === 'rejected';

  return (
    <>
      {isRejected && !state.isOverlayDismissed ? (
        <RejectionOverlay
          rejectionReason={rejectionReason}
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
  return (
    <Post.Provider post={post} onOpenMenu={onOpenMenu}>
      <Post.Root>
        <Post.Header>
          <Post.HeaderInfo>
            <Post.Avatar />
            <Post.AuthorBlock>
              <Post.AuthorNameRow>
                <Post.AuthorName />
                <Post.VerifiedBadge />
              </Post.AuthorNameRow>
              <Post.Timestamp />
            </Post.AuthorBlock>
          </Post.HeaderInfo>

          <Post.MenuButton />
        </Post.Header>

        <Post.Media>
          <PendingStatusOverlay status={post.status} rejectionReason={post.rejectionReason} />
        </Post.Media>

        <Post.Body>
          <Post.AuthorName className="mb-1 inline-block cursor-pointer hover:underline" />
          <Post.Caption />
        </Post.Body>
      </Post.Root>
    </Post.Provider>
  );
}
