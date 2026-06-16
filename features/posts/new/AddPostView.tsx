'use client';

import { useRef, useState } from 'react';

import AddPostHeader from './components/AddPostHeader';
import AddPostFooter from './components/AddPostFooter';
import SelectedMediaSlider from './components/SelectedMediaSlider';
import SelectedGallery from './components/SelectedGallery';
import PostDetailsForm from './components/PostDetailsForm';
import { usePostFlow } from './hooks/usePostFlow';
import { MAX_IMAGES } from './constants';
import { useMediaStore } from './services/mediaStore';

interface AddPostViewProps {
  onNavigate: (view: string) => void;
}

export default function AddPostView({ onNavigate }: AddPostViewProps) {
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const [captionTouched, setCaptionTouched] = useState(false);

  const { phase, caption, setCaption, media, isUploadPending, isSubmitting, handleBack, handleNext } =
    usePostFlow(onNavigate);
  const isAtLimit = useMediaStore((s) => s.itemMap.size >= MAX_IMAGES);

  function renderBody() {
    if (phase === 'select') {
      return (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <SelectedMediaSlider aspectClassName="aspect-[4/5] max-h-[50vh]" />
          <div className="flex-1 min-h-0 overflow-y-auto pb-20">
            <SelectedGallery
              onRetry={media.retryUpload}
              onRemove={media.removeItem}
            />
          </div>
        </div>
      );
    }

    if (phase === 'details') {
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

    return null;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-surface-l3 relative overflow-hidden select-none">
      {/* accept="image/*" opens native gallery on iOS/Android */}
      <input
        ref={imagesInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) media.addFiles(files);
          e.target.value = '';
        }}
      />

      <AddPostHeader onBack={handleBack} />

      {renderBody()}

      <AddPostFooter
        phase={phase}
        caption={caption}
        isSubmitting={isSubmitting}
        isUploadPending={isUploadPending}
        isAtLimit={isAtLimit}
        onNext={handleNext}
        onTriggerPicker={() => imagesInputRef.current?.click()}
      />
    </div>
  );
}
