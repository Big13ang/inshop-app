import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { USERNAME_REGEX } from "@/features/profile/edit/editProfileSchema";
import { PublicProfileView } from "@/features/profile/overview/PublicProfileView";
import { ProfileOverviewSkeleton } from "@/features/profile/components/ProfileSkeleton";
import { getPublicSellerProfile } from "@/features/profile/services/profileServerService";
import { constructMetadata } from "@/lib/utils/metadata";
import { Result } from "@/lib/utils/result";

interface ProfilePageProps {
    params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
    const rawHandle = (await params).handle;
    const handle = decodeURIComponent(rawHandle);
    if (!handle.startsWith("@")) return {};

    const username = handle.slice(1);
    const dataResult = await Result.try(() => getPublicSellerProfile(username));
    const data = dataResult.ok ? dataResult.value : null;

    if (!data?.shop) {
        return constructMetadata({
            title: `@${username}`,
            description: `مشاهده پروفایل و محصولات فروشگاه @${username} در اینشاپ`,
        });
    }

    const profile = data.shop;
    const rawShopName = profile.shopName?.trim();
    const title = rawShopName ? `${rawShopName} (@${profile.username})` : `@${profile.username}`;
    const description = profile.bio?.trim()
        ? profile.bio.trim().slice(0, 160)
        : `مشاهده محصولات و خرید آنلاین از ${rawShopName || `@${profile.username}`} در اینشاپ`;

    return constructMetadata({
        title,
        description,
        image: profile.profilePhotoUrl,
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

    const dataResult = await Result.try(() => getPublicSellerProfile(username));
    const initialData = dataResult.ok ? dataResult.value : null;

    return <PublicProfileView username={username} initialData={initialData} />;
}

export default function ProfilePage({ params }: ProfilePageProps) {
    return (
        <Suspense fallback={<ProfileOverviewSkeleton />}>
            <ProfileHandleContent params={params} />
        </Suspense>
    );
}

