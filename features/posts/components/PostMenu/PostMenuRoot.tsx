'use client';

import { ReactNode } from 'react';
import { Menu } from '@/components/ui/Menu';

interface PostMenuRootProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function PostMenuRoot({ isOpen, onClose, children }: PostMenuRootProps) {
  return (
    <Menu.Root isOpen={isOpen} onClose={onClose}>
      {children}
    </Menu.Root>
  );
}
