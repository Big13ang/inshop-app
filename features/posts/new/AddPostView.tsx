'use client';

import { useRef } from 'react';

import AlertBanner from './components/AlertBanner';
import AddPostHeader from './components/AddPostHeader';
import AddPostFooter from './components/AddPostFooter';
import SelectedMediaSlider from './components/SelectedMediaSlider';
import SelectedGallery from './components/SelectedGallery';
import PostDetailsForm from './components/PostDetailsForm';
import UploadProgressLoader from './components/UploadProgressLoader';
import ReelsSelectLayout from './components/ReelsSelectLayout';
import PostTypeDialog from './components/PostTypeDialog';
import { usePostFlow } from './hooks/usePostFlow';

interface AddPostViewProps {
  onNavigate: (view: string) => void;
  selectedSellerName?: string;
  role?: string;
  onLogout?: () => void;
}

export default function AddPostView({ onNavigate }: AddPostViewProps) {
  const videoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  const {
    postType, setPostType,
    phase,
    caption, setCaption,
    alertMessage,
    reels,
    album,
    activeMedia,
    imagesMedia,
    handleBack,
    handleNext,
  } = usePostFlow(onNavigate);

  function renderBody() {
    if (postType === 'images' && phase === 'select') {
      return (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <SelectedMediaSlider
            media={imagesMedia}
            activePreviewIdx={album.activePreviewIdx}
            onActiveSlideChange={album.setActivePreviewIdx}
            onRemoveItem={album.handleRemoveFromSlider}
            onTriggerPicker={() => imagesInputRef.current?.click()}
            aspectClassName="aspect-[4/5]"
          />
          <div className="flex-1 min-h-0 overflow-y-auto pb-20">
            <SelectedGallery
              pickedImages={album.pickedImages}
              selectedIds={album.selectedIds}
              onToggleId={album.handleToggleId}
            />
          </div>
        </div>
      );
    }

    if (postType === 'reels' && phase === 'select') {
      return (
        <div className="flex-1 overflow-y-auto flex flex-col pb-20">
          <ReelsSelectLayout
            reelsVideo={reels.reelsVideo}
            reelsCover={reels.reelsCover}
            onPickVideo={() => videoInputRef.current?.click()}
            onPickCover={() => coverInputRef.current?.click()}
          />
        </div>
      );
    }

    if (phase === 'details') {
      return (
        <div className="flex-1 overflow-y-auto flex flex-col pb-20">
          <PostDetailsForm
            media={activeMedia}
            caption={caption}
            onCaptionChange={setCaption}
            hasInputError={caption.trim().length === 0}
            aspectClassName={postType === 'reels' ? 'aspect-9/16' : 'aspect-[4/5]'}
          />
        </div>
      );
    }

    return null;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-surface-l3 relative overflow-hidden select-none">
      <AlertBanner alertMessage={alertMessage} />

      <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={reels.handleVideoChange} />
      <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={reels.handleCoverChange} />
      <input ref={imagesInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={album.handleImagesChange} />

      <AddPostHeader onBack={handleBack} />

      {renderBody()}

      <AddPostFooter
        postType={postType}
        phase={phase}
        caption={caption}
        onNext={handleNext}
        onTriggerPicker={() => imagesInputRef.current?.click()}
      />

      <UploadProgressLoader />

      <PostTypeDialog
        isOpen={postType === null}
        onChoose={setPostType}
        onDismiss={() => onNavigate('pending-posts')}
      />
    </div>
  );
}
