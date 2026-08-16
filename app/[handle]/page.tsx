import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { USERNAME_REGEX } from "@/features/profile/edit/editProfileSchema";
import PublicProfileView from "@/features/profile/overview/PublicProfileView";
import { ProfileOverviewSkeleton } from "@/features/profile/components/ProfileSkeleton";
import { getPublicSellerProfile } from "@/features/profile/services/profileServerService";

import { constructMetadata } from "@/lib/utils/metadata";

interface ProfilePageProps {
    params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
    const rawHandle = (await params).handle;
    const handle = decodeURIComponent(rawHandle);
    if (!handle.startsWith("@")) return {};

    const username = handle.slice(1);
    const data = await getPublicSellerProfile(username);

    if (!data?.shop) {
        return constructMetadata({
            title: 'صفحه پیدا نشد',
            description: 'این پروفایل وجود ندارد یا حذف شده است.',
            noIndex: true,
        });
    }

    const profile = data.shop;

    return constructMetadata({
        title: `@${profile.username}`,
        description: profile.bio || undefined,
        image: profile.profilePhotoUrl,
        shopName: profile.shopName,
    });
}

async function ProfileHandleContent({ params }: ProfilePageProps) {
    const rawHandle = (await params).handle;
    const handle = decodeURIComponent(rawHandle);

    if (!handle.startsWith("@")) {
        notFound();
    }

    const username = handle.slice(1);

    if (!USERNAME_REGEX.test(username)) {
        notFound();
    }

    const initialData = await getPublicSellerProfile(username);
    if (!initialData?.shop) {
        notFound();
    }

    return <PublicProfileView username={username} initialData={initialData} />;
}

export default function ProfilePage({ params }: ProfilePageProps) {
    return (
        <Suspense fallback={<ProfileOverviewSkeleton />}>
            <ProfileHandleContent params={params} />
        </Suspense>
    );
}
