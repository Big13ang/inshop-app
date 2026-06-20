'use client';

import Header from '@/components/layout/Header';
import { text } from '../constants';

interface AddPostHeaderProps {
  onBack: () => void;
}

export default function AddPostHeader({ onBack }: AddPostHeaderProps) {
  return (
    <Header.Root>
      <Header.Back onClick={onBack} id="add-post-back-btn" />
      <Header.Title className="text-base">{text.headerTitle}</Header.Title>
      <Header.Right />
    </Header.Root>
  );
}
