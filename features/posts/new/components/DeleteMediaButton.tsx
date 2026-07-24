'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { postsQueryService } from '@/features/posts/services/postsQueryService';
import { useMediaStore } from '../services/mediaStore';
import DeleteImageDialog from './DeleteImageDialog';
import { useUploadSession } from '../services/uploadSession';

interface DeleteMediaButtonProps {
  mediaId: string;
}

export default function DeleteMediaButton({ mediaId }: DeleteMediaButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: session } = useUploadSession();

  const {
    isPending: isDeleting,
    mutate: deletePhotoMutation,
  } = postsQueryService.useDeleteUploadSessionPhoto();

  function handleOpenDialog(e: React.MouseEvent) {
    e.stopPropagation();
    setIsDialogOpen(true);
  }

  function handleCloseDialog() {
    if (isDeleting) return;
    setIsDialogOpen(false);
  }

  function handleConfirmDelete() {
    if (!session?.uploadSessionId) return;

    deletePhotoMutation({
      mediaId,
      uploadSessionId: session.uploadSessionId,
    },
      {
        onSettled: () => setIsDialogOpen(false),
        onSuccess: () => useMediaStore.getState().removeItem(mediaId),
      }
    );
  }

  return (
    <>
      <Button
        id={`btn-delete-media-${mediaId}`}
        onClick={handleOpenDialog}
        variant="filled"
        shape="circle"
        className="absolute top-4 left-4 bg-zinc-900/90 text-zinc-300 hover:text-white size-8 flex items-center justify-center hover:bg-zinc-950 transition-all border border-white/15 z-[25] p-0 min-w-0"
        title="حذف از انتخاب شده‌ها"
        disabled={isDeleting}
      >
        {isDeleting ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </Button>

      <DeleteImageDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}

