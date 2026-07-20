'use client';

import Header from '@/components/layout/Header';
import { text } from '../constants';

export default function AddPostHeader() {
  return (
    <Header.Root>
      <Header.Back id="add-post-back-btn" />
      <Header.Title className="text-base">{text.headerTitle}</Header.Title>
      <Header.Right />
    </Header.Root>
  );
}
