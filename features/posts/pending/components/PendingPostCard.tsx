'use client';

import { Clock, AlertOctagon } from 'lucide-react';
import { toast } from 'sonner';
import { Post, usePostContext } from '@/features/posts/components/Post';
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
  return (
    <Post.Provider post={post} onOpenMenu={onOpenMenu}>
      <Post.Root>
        <Post.Header>
          <Post.HeaderInfo>
            <Post.Avatar />
            <Post.AuthorBlock>
              <Post.AuthorNameRow>
                <Post.AuthorName />
              </Post.AuthorNameRow>
              <Post.Timestamp />
            </Post.AuthorBlock>
          </Post.HeaderInfo>

          <Post.MenuButton />
        </Post.Header>

        <Post.Media>
          <PendingStatusOverlay status={post.status} rejectReason={post.rejectReason} />
        </Post.Media>

        <Post.Body>
          <Post.AuthorName className="mb-1 inline-block cursor-pointer hover:underline" />
          <Post.Caption />
        </Post.Body>
      </Post.Root>
    </Post.Provider>
  );
}
