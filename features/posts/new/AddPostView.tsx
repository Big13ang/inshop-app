'use client';

import { useRef, useSyncExternalStore } from 'react';

import AddPostHeader from './components/AddPostHeader';
import AddPostOnboardingSheet from './components/AddPostOnboardingSheet';
import AddPostFooter from './components/AddPostFooter';
import AddPostBody from './components/AddPostBody';
import { isMobile } from '@/lib/utils';
import { startUploadPipeline } from './services/uploadPipeline';
import { useUploadSession } from './services/uploadSession';

export type PostFlowNavigationIntent = 'back' | 'pending-posts';

interface AddPostViewProps {
  onNavigate?: (intent: PostFlowNavigationIntent) => void;
}

const subscribeMounted = () => () => {};
const getSnapshotMounted = () => true;
const getServerSnapshotMounted = () => false;

function useHasMounted() {
  return useSyncExternalStore(subscribeMounted, getSnapshotMounted, getServerSnapshotMounted);
}

export default function AddPostView({ onNavigate: _onNavigate }: AddPostViewProps) {
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const isMounted = useHasMounted();
  const { data: uploadSession, isSuccess, isPending: isSessionPending } = useUploadSession();
  const isSessionLoading = isMounted && isSessionPending;
  const accept = isMounted && isMobile() ? 'image/*' : 'image/jpeg,image/png,image/webp';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files!);

    if (files.length > 0 && isSuccess && uploadSession?.uploadSessionId) {
      startUploadPipeline(files, uploadSession.uploadSessionId);
    }

    e.target.value = '';
  };

  const handleTriggerPicker = () => {
    imagesInputRef.current?.click();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-surface-l3 relative overflow-hidden select-none">
      {/* accept="image/*" opens native gallery on iOS/Android */}
      <input
        ref={imagesInputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <AddPostOnboardingSheet />
      <AddPostHeader />

      <AddPostBody isSessionLoading={isSessionLoading} />

      <AddPostFooter
        isSessionLoading={isSessionLoading}
        onTriggerPicker={handleTriggerPicker}
      />

    </div>
  );
}


