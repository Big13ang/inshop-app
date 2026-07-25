'use client';

import Footer from '@/components/layout/Footer';
import { Loader2 } from 'lucide-react';
import { text } from '../constants';
import { useMediaStore } from '../services/mediaStore';
import { postsQueryService } from '../../services/postsQueryService';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useUploadSession } from '../services/uploadSession';

export default function DetailsPhaseFooter() {
  const router = useRouter();
  const { data: session } = useUploadSession();
  const caption = useMediaStore((s) => s.caption);
  const setPhase = useMediaStore((s) => s.setPhase);
  const reset = useMediaStore((s) => s.reset);

  const { mutate: publishPost, isPending: isPublishing } =
    postsQueryService.useSubmitPost(() => {
      toast.success(text.uploadSuccessTitle, {
        description: text.uploadSuccessDesc,
      });

      reset();
      router.push('/app/posts/pending');
    });

  const handlePublishPost = () => {
    if (!session) return;

    const mediaList = useMediaStore.getState().mediaList;
    const selectedItems = mediaList
      .filter((i) => i.order !== null)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const isUploadingOrMissingServerId = selectedItems.some(
      (i) => i.status !== 'uploaded' || !i.serverMediaId,
    );
    if (isUploadingOrMissingServerId) {
      toast.warning(text.alertUploadsInProgress);
      return;
    }

    const selectedMediaIds = selectedItems.map((i) => i.serverMediaId!);

    publishPost({
      mediaIds: selectedMediaIds,
      description: caption,
      uploadSessionId: session.uploadSessionId,
    });
  };

  const handleGoBackToSelect = () => setPhase('select');
  const shareDisabled = !caption.trim() || isPublishing;

  return (
    <Footer.Root className="flex items-center gap-3">
      <Footer.Button
        id="btn-share-post"
        onClick={handlePublishPost}
        disabled={shareDisabled}
        variant="primary"
        className="w-1/2"
      >
        {isPublishing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <span className="leading-none flex items-center font-bold">
            {text.shareButton}
          </span>
        )}
      </Footer.Button>
      <Footer.Button
        id="btn-back-to-select"
        onClick={handleGoBackToSelect}
        disabled={isPublishing}
        variant="outline"
        className="w-1/2"
      >
        <span className="leading-none">{text.previousButton}</span>
      </Footer.Button>
    </Footer.Root>
  );
}
