'use client';

import { useMediaStore } from '../services/mediaStore';
import SelectPhaseFooter from './SelectPhaseFooter';
import DetailsPhaseFooter from './DetailsPhaseFooter';

interface AddPostFooterProps {
  isSessionLoading?: boolean;
  onTriggerPicker: () => void;
}

export default function AddPostFooter({
  isSessionLoading = false,
  onTriggerPicker,
}: AddPostFooterProps) {
  const phase = useMediaStore((s) => s.phase);

  if (phase === 'details') {
    return <DetailsPhaseFooter />;
  }

  return (
    <SelectPhaseFooter
      isSessionLoading={isSessionLoading}
      onTriggerPicker={onTriggerPicker}
    />
  );
}
