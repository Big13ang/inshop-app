import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePostContext } from './PostContext';
import { normalizePostDescription } from '../../utils/formatDescription';

const MAX_COLLAPSED_LINES = 3;
const MAX_COLLAPSED_CHARS = 180;
const MORE_LABEL = '...بیشتر';

function truncateAtWordBoundary(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const sliced = text.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.7) {
    return sliced.slice(0, lastSpace).trimEnd();
  }
  return sliced.trimEnd();
}

function computeVisibleDescription(
  normalizedText: string,
  isExpanded: boolean,
): { visibleText: string; shouldTruncate: boolean } {
  if (!normalizedText) {
    return { visibleText: '', shouldTruncate: false };
  }

  const lines = normalizedText.split('\n');
  const exceedsLineLimit = lines.length > MAX_COLLAPSED_LINES;
  const exceedsCharLimit = normalizedText.length > MAX_COLLAPSED_CHARS;
  const shouldTruncate = exceedsLineLimit || exceedsCharLimit;

  if (!shouldTruncate || isExpanded) {
    return { visibleText: normalizedText, shouldTruncate };
  }

  let visibleText = normalizedText;
  if (exceedsLineLimit) {
    // Keep first MAX_COLLAPSED_LINES lines completely intact so breaking lines are not ruined
    visibleText = lines.slice(0, MAX_COLLAPSED_LINES).join('\n').trimEnd();
  } else if (exceedsCharLimit) {
    visibleText = truncateAtWordBoundary(normalizedText, MAX_COLLAPSED_CHARS);
  }

  return { visibleText, shouldTruncate };
}

export function PostDescription() {
  const { state } = usePostContext();
  const [isExpanded, setIsExpanded] = useState(false);

  const description = normalizePostDescription(state.post.description);
  const { visibleText, shouldTruncate } = computeVisibleDescription(
    description,
    isExpanded,
  );

  const handleExpand = () => setIsExpanded(true);

  return (
    <div className="text-[13px] leading-6 text-foreground">
      <p className="whitespace-pre-wrap break-words">
        {visibleText}
        {shouldTruncate && !isExpanded ? (
          <>
            {' '}
            <Button
              type="button"
              variant="link"
              size="xs"
              onClick={handleExpand}
              className="inline h-auto px-0 py-0 align-baseline text-[13px] font-bold text-primary hover:no-underline"
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
