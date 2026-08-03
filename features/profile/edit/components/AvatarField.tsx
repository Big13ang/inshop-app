'use client';

import { Camera, LoaderCircle, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AVATAR_ACCEPTED_TYPES, text } from '../../constants';
import { useRef, useState } from 'react';
import { useUploadProfilePhoto } from '../../services/profileMutationService';
import { useUser } from '../../context/UserContext';

export default function AvatarField() {
  const { user } = useUser();
  const [profileImage, setProfileImage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isPending: isUploading,
    mutate: uploadProfileMutation
  } = useUploadProfilePhoto();

  const handleImageProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProfileImg = e.target.files?.[0];
    if (!newProfileImg) return;

    const previewUrl = URL.createObjectURL(newProfileImg);
    setProfileImage(previewUrl);
    uploadProfileMutation(newProfileImg);
  }

  const handleImageChangeBtnClick = () => {
    fileInputRef.current?.click();
  }

  const currentUserProfile = user?.sellerProfile?.profilePhotoUrl;
  const displayImage = profileImage || currentUserProfile;

  return (
    <div className="flex flex-col items-center py-2">
      <span className="mb-3 flex items-center gap-1.5 self-start px-1 text-xs font-bold text-secondary">
        <Camera className="size-4" aria-hidden="true" />
        <span>{text.edit.avatarSectionTitle}</span>
      </span>

      <div className="relative">
        <div className="size-24 overflow-hidden rounded-pill border-2 border-container-base bg-surface-l1 shadow-float">
          {displayImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayImage} alt={text.edit.avatarAlt} className="size-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex size-full items-center justify-center text-secondary">
              <Store className="size-8" aria-hidden="true" />
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="filled"
          size="icon-lg"
          shape="circle"
          disabled={isUploading}
          aria-label={text.edit.avatarUploadAction}
          onClick={handleImageChangeBtnClick}
          className="absolute bottom-0 left-0 border-2 border-surface-l3 shadow-float"
        >
          {isUploading ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Camera className="size-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={AVATAR_ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={handleImageProfileChange}
        data-testid="avatar-file-input"
      />
    </div>
  );
}
