import { Suspense } from "react";
import { notFound } from "next/navigation";
import { USERNAME_REGEX } from "@/features/profile/edit/editProfileSchema";
import ProfileView from "@/features/profile/overview/ProfileView";
import { ProfileOverviewSkeleton } from "@/features/profile/components/ProfileSkeleton";

interface ProfilePageProps {
    params: Promise<{ handle: string }>;
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

    return <ProfileView targetUsername={username} />;
}

export default function ProfilePage({ params }: ProfilePageProps) {
    return (
        <Suspense fallback={<ProfileOverviewSkeleton />}>
            <ProfileHandleContent params={params} />
        </Suspense>
    );
}
