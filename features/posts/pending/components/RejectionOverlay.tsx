'use client';

import { useState } from 'react';
import { AlertOctagon } from 'lucide-react';
import { text } from '../constants';
import { Button } from '@/components/ui/button';
import RejectionDetailsList from './RejectionDetailsList';

interface RejectionOverlayProps {
  rejectionReason?: string;
  onDismiss: () => void;
}

export default function RejectionOverlay({ rejectionReason, onDismiss }: RejectionOverlayProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-zinc-950/75 p-5 backdrop-blur-sm transition-opacity duration-300"
      dir="rtl"
    >
      <div className="flex w-full max-w-[270px] flex-col items-center rounded-2xl border border-zinc-200/80 bg-white p-5 text-center text-zinc-900 shadow-2xl transition-all duration-300 ease-out">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
          <AlertOctagon className="h-5 w-5 text-zinc-950" />
        </div>

        <h4 className="mb-1.5 font-sans text-[13px] font-bold leading-none text-zinc-950">{text.rejectionTitle}</h4>

        <p className="mb-4 px-1 text-center font-sans text-[11px] font-medium leading-5 text-zinc-600">
          {rejectionReason ?? text.rejectionDefaultReason}
        </p>

        <Button
          onClick={onDismiss}
          variant="filled"
          className="w-full h-auto py-2.5 font-sans text-[10.5px] font-bold leading-none rounded-xl"
        >
          {text.rejectionActionText}
        </Button>

        <Button
          onClick={() => setShowDetails((current) => !current)}
          variant="link"
          className="mt-3 h-auto p-0 font-sans text-[9px] text-zinc-400 hover:text-zinc-600 no-underline hover:no-underline font-normal cursor-pointer"
        >
          {showDetails ? text.rejectionHideDetails : text.rejectionShowDetails}
        </Button>

        {showDetails ? <RejectionDetailsList /> : null}
      </div>
    </div>
  );
}
