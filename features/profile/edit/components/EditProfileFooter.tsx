'use client';

import { Check, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { text } from '../../constants';

interface EditProfileFooterProps {
  formId: string;
  isSaving: boolean;
  onCancel: () => void;
}

export default function EditProfileFooter({ formId, isSaving, onCancel }: EditProfileFooterProps) {
  return (
    <footer className="sticky bottom-0 left-0 right-0 z-40 w-full shrink-0 border-t border-zinc-200 bg-surface/95 p-3.5 shadow-lg backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3" dir="rtl">
        {/* Right Button: Save */}
        <Button
          id="profile-save-btn"
          type="submit"
          form={formId}
          variant="filled"
          disabled={isSaving}
          className="flex-1 shrink min-w-0 h-12 font-bold text-xs rounded-xl gap-1.5 shadow-sm active:scale-98"
        >
          {isSaving ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="size-4" aria-hidden="true" />
          )}
          <span>{isSaving ? text.edit.savingAction : text.edit.saveAction}</span>
        </Button>

        {/* Left Button: Cancel */}
        <Button
          id="profile-cancel-btn"
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 shrink min-w-0 h-12 font-bold text-xs rounded-xl gap-1.5 border border-zinc-200 active:scale-98"
        >
          <span>{text.edit.cancelAction}</span>
        </Button>
      </div>
    </footer>
  );
}

