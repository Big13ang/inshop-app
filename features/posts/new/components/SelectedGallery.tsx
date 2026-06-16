'use client';

import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { useMediaStore } from '../services/mediaStore';
import { useShallow } from 'zustand/react/shallow';
import DeleteImageDialog from './DeleteImageDialog';
import GalleryCell from './GalleryCell';
import { MAX_IMAGES } from '../constants';


interface SelectedGalleryProps {
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function SelectedGallery({ onRetry, onRemove }: SelectedGalleryProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const ids = useMediaStore(useShallow((s) => Array.from(s.itemMap.keys())));
  const selectedIds = useMediaStore((s) => s.selectedIds);
  const isAtLimit = ids.length >= MAX_IMAGES;

  if (ids.length === 0) {
    return (
      <div className="flex flex-col select-none mt-6 pb-6" id="selected-gallery-container">
        <div className="px-4 mb-3">
          <span className="text-[10px] font-medium text-zinc-500">گالری انتخابی</span>
        </div>
        <div className="grid grid-cols-3 gap-2 px-4" dir="ltr">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-zinc-300" strokeWidth={1.5} />
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center text-center px-8 mt-5 gap-1.5">
          <p className="text-sm font-semibold text-zinc-400">تصویری انتخاب نشده</p>
          <p className="text-xs text-zinc-400 leading-5 max-w-[220px]">با دکمه «اضافه کردن» در پایین صفحه تصاویر خود را وارد کنید</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col select-none mt-6" id="selected-gallery-container">
      <div className="px-4 mb-3 flex justify-between items-center">
        <span className="text-[10px] font-medium text-zinc-400">آپلود شده را لمس کنید تا انتخاب شود</span>
        <span className={`text-[10px] font-medium ${isAtLimit ? 'text-red-500' : 'text-zinc-500'}`}>
          {ids.length}/{MAX_IMAGES} تصویر
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 px-4 pb-6" dir="ltr">
        {ids.map((id) => (
          <GalleryCell
            key={id}
            id={id}
            selectionIndex={selectedIds.indexOf(id)}
            onToggle={() => useMediaStore.getState().toggleSelected(id)}
            onLongPress={(targetId) => setPendingDeleteId(targetId)}
            onRetry={onRetry}
          />
        ))}
      </div>

      <DeleteImageDialog
        isOpen={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) {
            onRemove(pendingDeleteId);
            setPendingDeleteId(null);
          }
        }}
      />
    </div>
  );
}
