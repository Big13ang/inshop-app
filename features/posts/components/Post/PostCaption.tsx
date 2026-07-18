import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePostContext } from './PostContext';

const COLLAPSED_DESCRIPTION_LENGTH = 140;
const MORE_LABEL = 'بیشتر...';

export function PostCaption() {
  const { state } = usePostContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const description = state.post.description.trim();
  const shouldTruncate = description.length > COLLAPSED_DESCRIPTION_LENGTH;
  const visibleDescription =
    shouldTruncate && !isExpanded
      ? description.slice(0, COLLAPSED_DESCRIPTION_LENGTH).trimEnd()
      : description;

  const handleExpand = () => setIsExpanded(true);

  return (
    <div className="text-[13px] leading-6 text-foreground">
      <p
        className="overflow-hidden text-justify transition-[max-height,opacity] duration-normal ease-out-smooth"
        style={{ maxHeight: isExpanded ? '80rem' : '4.5rem' }}
      >
        {visibleDescription}
        {shouldTruncate && !isExpanded ? (
          <>
            {' '}
            <Button
              type="button"
              variant="link"
              size="xs"
              onClick={handleExpand}
              className="inline h-auto px-0 align-baseline text-[13px] font-bold text-primary"
              aria-expanded={isExpanded}
            >
              {MORE_LABEL}
            </Button>
          </>
        ) : null}
      </p>
    </div>
  );
}
