import { ArrowRight } from 'lucide-react';
import { Drawer } from 'vaul';
import { Button } from '@/components/ui/button';
import { text } from '../constants';

interface CategoryPickerHeaderProps {
  title: string;
  // Set only on the sub-category step, where the user can go back to the top level.
  onBack?: () => void;
}

export function CategoryPickerHeader({ title, onBack }: CategoryPickerHeaderProps) {
  return (
    <>
      <Drawer.Title className="mb-3 flex min-h-10 items-center gap-2 text-base font-bold">
        {onBack ? (
          <Button type="button" variant="ghost" size="icon" aria-label={text.categoryBack} onClick={onBack}>
            <ArrowRight className="h-5 w-5" />
          </Button>
        ) : null}
        <span className="truncate">{title}</span>
      </Drawer.Title>
      <Drawer.Description className="sr-only">{text.categoryPlaceholder}</Drawer.Description>
    </>
  );
}
