'use client';

import { useRef, useState } from 'react';

import AddPostHeader from './components/AddPostHeader';
import AddPostOnboardingSheet from './components/AddPostOnboardingSheet';
import AddPostFooter from './components/AddPostFooter';
import SelectedMediaSlider from './components/SelectedMediaSlider';
import SelectedGallery from './components/SelectedGallery';
import PostDetailsForm from './components/PostDetailsForm';
import AddPostLoadingSkeleton from './components/AddPostLoadingSkeleton';
import { usePostFlow, type PostFlowNavigationIntent } from './hooks/usePostFlow';
import { MAX_IMAGES } from './constants';
import { useMediaStore } from './services/mediaStore';
import { isMobile } from '@/lib/utils';

interface AddPostViewProps {
  onNavigate: (intent: PostFlowNavigationIntent) => void;
}

export default function AddPostView({ onNavigate }: AddPostViewProps) {
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const [captionTouched, setCaptionTouched] = useState(false);

  const {
    phase,
    caption,
    setCaption,
    media,
    isUploadPending,
    isSubmitting,
    isSessionLoading,
    isValidating,
    handleNext,
  } = usePostFlow(onNavigate);
  const isAtLimit = useMediaStore((s) => s.itemMap.size >= MAX_IMAGES);

  function renderBody() {
    if (isSessionLoading) {
      return <AddPostLoadingSkeleton />;
    }

    if (phase === 'select') {
      return (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <SelectedMediaSlider aspectClassName="aspect-square" />
          <div className="flex-1 min-h-0 overflow-y-auto pb-20">
            <SelectedGallery
              onRetry={media.retryUpload}
              onRemove={media.removeItem}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto flex flex-col pb-20">
        <PostDetailsForm
          caption={caption}
          onCaptionChange={(val) => { setCaptionTouched(true); setCaption(val); }}
          hasInputError={captionTouched && caption.trim().length === 0}
        />
      </div>
    );
  }

  const accept = isMobile()
    ? 'image/*'
    : 'image/jpeg,image/png,image/webp';

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-surface-l3 relative overflow-hidden select-none">
      {/* accept="image/*" opens native gallery on iOS/Android */}
      <input
        ref={imagesInputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files!);
          if (files.length > 0) media.addFiles(files);
          e.target.value = '';
        }}
      />

      <AddPostOnboardingSheet />
      <AddPostHeader />

      {renderBody()}

      <AddPostFooter
        phase={phase}
        caption={caption}
        isSubmitting={isSubmitting}
        isUploadPending={isUploadPending}
        isAtLimit={isAtLimit}
        isSessionLoading={isSessionLoading}
        isValidating={isValidating}
        onNext={handleNext}
        onTriggerPicker={() => imagesInputRef.current?.click()}
      />
    </div>
  );
}
