'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Otp from '@/features/auth/otp/Otp';
import AppLogo from '@/features/auth/login/components/AppLogo';
import { MessageSquare } from 'lucide-react';

export default function OtpPage() {
    return (
        <Suspense fallback={<OtpSkeletonFallback />}>
            <OtpContent />
        </Suspense>
    );
}

function OtpContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const phone = searchParams.get('phone');

    if (!phone) {
        router.replace('/auth/login');
        return null;
    }

    return (
        <Otp phone={phone} />
    );
}

function OtpSkeletonFallback() {
    return (
        <div className="flex-1 flex flex-col justify-between h-full px-6 py-8 bg-surface-l2 animate-pulse" dir="rtl">
            <AppLogo />

            <div className="w-full max-w-sm mx-auto flex flex-col gap-8">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <span className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
                            <MessageSquare className="w-6 h-6 text-zinc-300" />
                        </span>
                    </div>
                    {/* Skeleton header */}
                    <div className="h-6 w-32 bg-zinc-200 rounded mx-auto mb-2" />
                    {/* Skeleton subtitle */}
                    <div className="h-4 w-48 bg-zinc-200 rounded mx-auto mb-2" />
                    {/* Skeleton link */}
                    <div className="h-3 w-16 bg-zinc-200 rounded mx-auto" />
                </div>

                {/* Skeleton inputs (four squares) */}
                <div className="flex justify-center gap-3" dir="ltr">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-14 h-16 bg-zinc-200 rounded-lg border border-zinc-200" />
                    ))}
                </div>

                {/* Skeleton timer */}
                <div className="h-4 w-20 bg-zinc-200 rounded mx-auto mt-4" />
            </div>

            <div className="pb-4" />
        </div>
    );
}

