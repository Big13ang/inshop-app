'use client';

import { Camera, LoaderCircle, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AVATAR_ACCEPTED_TYPES, text } from '../../constants';

interface AvatarFieldProps {
  value?: string;
  alt?: string;
  isUploading?: boolean;
  onChange?: (file: File, previewUrl: string) => void;
}

export default function AvatarField({ value, alt = '', isUploading = false }: AvatarFieldProps) {
  return (
    <div className="flex flex-col items-center py-2">
      <span className="mb-3 flex items-center gap-1.5 self-start px-1 text-xs font-bold text-secondary">
        <Camera className="size-4" aria-hidden="true" />
        <span>{text.edit.avatarSectionTitle}</span>
      </span>

      <div className="relative">
        <div className="size-24 overflow-hidden rounded-pill border-2 border-container-base bg-surface-l1 shadow-float">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={alt || text.edit.avatarAlt} className="size-full object-cover" referrerPolicy="no-referrer" />
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
        type="file"
        accept={AVATAR_ACCEPTED_TYPES.join(',')}
        className="hidden"
        data-testid="avatar-file-input"
      />
    </div>
  );
}
