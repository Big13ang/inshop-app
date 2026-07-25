'use client';

import { Phone, Settings, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { text } from '../../constants';

interface ProfileActionsProps {
  onCall: () => void;
  onEdit: () => void;
  onShare: () => void;
}

export default function ProfileActions({ onCall, onEdit, onShare }: ProfileActionsProps) {
  return (
    <div className="mt-4 flex items-center gap-2" dir="rtl">
      <Button
        id="profile-call-btn"
        variant="filled"
        onClick={onCall}
        className="tap-cta h-11 flex-1 rounded-input text-xs font-bold"
      >
        <Phone className="size-4" aria-hidden="true" />
        <span>{text.overview.callAction}</span>
      </Button>

      <Button
        id="profile-edit-btn"
        variant="secondary"
        onClick={onEdit}
        aria-label={text.overview.editActionTitle}
        title={text.overview.editActionTitle}
        className="tap-cta h-11 shrink-0 rounded-input px-3 text-xs font-bold"
      >
        <Settings className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">{text.overview.editAction}</span>
      </Button>

      <Button
        id="profile-share-btn"
        variant="secondary"
        onClick={onShare}
        aria-label={text.overview.shareActionTitle}
        title={text.overview.shareActionTitle}
        className="tap-cta h-11 shrink-0 rounded-input px-3 text-xs font-bold"
      >
        <Share2 className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">{text.overview.shareAction}</span>
      </Button>
    </div>
  );
}
