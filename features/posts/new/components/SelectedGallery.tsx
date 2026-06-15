'use client';

import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { useMediaStore } from '../services/mediaStore';
import { useShallow } from 'zustand/react/shallow';
import { BottomSheet } from '@/components/ui/BottomSheet';
import GalleryCell from './GalleryCell';


interface SelectedGalleryProps {
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function SelectedGallery({ onRetry, onRemove }: SelectedGalleryProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const ids = useMediaStore(useShallow((s) => Array.from(s.itemMap.keys())));
  const selectedIds = useMediaStore((s) => s.selectedIds);
  const uploadedCount = useMediaStore((s) =>
    Array.from(s.itemMap.values()).filter((it) => it.status === 'uploaded').length
  );

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
        <span className="text-[10px] text-zinc-500">{selectedIds.length} از {uploadedCount} انتخاب شده</span>
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

      <BottomSheet.Root
        isOpen={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
      >
        <BottomSheet.Overlay />
        <BottomSheet.Panel className="p-6 flex flex-col gap-5 text-center">
          <BottomSheet.Handle />
          <div className="flex flex-col gap-2">
            <BottomSheet.Title>حذف تصویر</BottomSheet.Title>
            <BottomSheet.Description>
              آیا از حذف این تصویر اطمینان دارید؟
            </BottomSheet.Description>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
            <button
              id="btn-confirm-delete"
              onClick={() => {
                if (pendingDeleteId) {
                  onRemove(pendingDeleteId);
                  setPendingDeleteId(null);
                }
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors"
            >
              بله، حذف شود
            </button>
            <button
              id="btn-reject-delete"
              onClick={() => setPendingDeleteId(null)}
              className="flex-1 py-3 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold text-sm transition-colors"
            >
              خیر، نگه داشته شود
            </button>
          </div>
        </BottomSheet.Panel>
      </BottomSheet.Root>
    </div>
  );
}
