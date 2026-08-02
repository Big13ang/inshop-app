'use client';

import { Store } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { text } from '../../constants';
import FormSection from './FormSection';

export default function ShopSection() {
  return (
    <FormSection.Root>
      <FormSection.Title icon={<Store className="size-4" />}>
        {text.edit.shopSectionTitle}
      </FormSection.Title>

      <FormSection.Field
        label={text.edit.shopNameLabel}
        htmlFor="profile-shop-name"
        isRequired
      >
        <Input
          id="profile-shop-name"
          inputSize="sm"
          placeholder={text.edit.shopNamePlaceholder}
        />
      </FormSection.Field>

      <FormSection.Field
        label={text.edit.handleLabel}
        htmlFor="profile-handle"
        helperText={text.edit.handleHelper}
      >
        <div className="relative flex items-center group" dir="ltr">
          <span className="pointer-events-none absolute left-3 text-xs text-secondary/70 transition-colors duration-300 group-focus-within:text-zinc-950 select-none">
            @
          </span>
          <Input
            id="profile-handle"
            dir="ltr"
            inputSize="sm"
            placeholder={text.edit.handlePlaceholder}
            className="pl-7 pr-8 font-mono tracking-wider"
          />
          <div className="absolute right-2.5 flex items-center pointer-events-none" />
        </div>
      </FormSection.Field>
    </FormSection.Root>
  );
}
