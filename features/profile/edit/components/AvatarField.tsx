'use client';

import { useRef } from 'react';
import { Camera, Store } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AVATAR_ACCEPTED_TYPES, text } from '../../constants';
import { toAvatarPreview } from '../../utils/avatar';

interface AvatarFieldProps {
  value: string;
  alt: string;
  onChange: (dataUrl: string) => void;
}

export default function AvatarField({ value, alt, onChange }: AvatarFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so re-picking the same file still fires a change event.
    event.target.value = '';
    if (!file) return;

    const preview = await toAvatarPreview(file);
    if (!preview.ok) {
      toast.error(preview.error);
      return;
    }

    onChange(preview.value);
    toast.success(text.edit.avatarSelected);
  };

  return (
    <div className="flex flex-col items-center py-2">
      <span className="mb-3 flex items-center gap-1.5 self-start px-1 text-xs font-bold text-secondary">
        <Camera className="size-4" aria-hidden="true" />
        <span>{text.edit.avatarSectionTitle}</span>
      </span>

      <div className="relative">
        <div className="size-24 overflow-hidden rounded-pill border-2 border-container-base bg-surface-l1 shadow-float">
          {value ? (
            // Either a CDN URL or a local data: URL preview — next/image cannot handle both.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={alt} className="size-full object-cover" referrerPolicy="no-referrer" />
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
          onClick={openFilePicker}
          aria-label={text.edit.avatarUploadAction}
          className="absolute bottom-0 left-0 border-2 border-surface-l3 shadow-float"
        >
          <Camera className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={AVATAR_ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={handleFileChange}
        data-testid="avatar-file-input"
      />
    </div>
  );
}
