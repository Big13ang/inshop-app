'use client';

import { ImageIcon } from 'lucide-react';
import { useMediaStore } from '../services/mediaStore';
import { reorderItems } from '../utils/reorderItems';
import GalleryCell from './GalleryCell';
import { MAX_IMAGES } from '../constants';

function getSelectionIndex(order: number | null): number {
  const UNSELECTED_INDEX = -1;
  return order !== null ? order - 1 : UNSELECTED_INDEX;
}

export default function SelectedGallery() {
  const mediaList = useMediaStore((s) => s.mediaList);
  const setMediaList = useMediaStore((s) => s.setMediaList);
  const isAtLimit = mediaList.length >= MAX_IMAGES;

  const handleToggleSelection = (id: string) => {
    const updated = reorderItems(mediaList, id);
    setMediaList(updated);
  };

  if (mediaList.length === 0) {
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
          {mediaList.length}/{MAX_IMAGES} تصویر
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 px-4 pb-6" dir="ltr">
        {mediaList.map((item) => {
          const selectionIndex = getSelectionIndex(item.order);

          return (
            <GalleryCell
              key={item.id}
              id={item.id}
              selectionIndex={selectionIndex}
              onToggle={() => handleToggleSelection(item.id)}
            />
          );
        })}
      </div>
    </div>
  );
}


