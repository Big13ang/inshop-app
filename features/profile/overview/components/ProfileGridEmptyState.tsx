import { useRouter } from "next/navigation";
import { PROFILE_ROUTES, text } from "../../constants";
import { Button } from "@/components/ui/button";

export function ProfileEmptyState() {
    const router = useRouter();

    const handleAddPost = () => {
        router.push(PROFILE_ROUTES.newPost);
    };

    return (
        <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-2 text-secondary" id="profile-empty-state">
            <span className="font-bold text-sm text-primary">{text.overview.gridEmptyTitle}</span>
            <span className="text-xs">{text.overview.gridEmptyDescription}</span>
            <Button
                id="profile-add-post-btn"
                variant="filled"
                onClick={handleAddPost}
                className="mt-3 h-10 px-5 rounded-xl text-xs font-bold"
            >
                {text.overview.gridEmptyAction}
            </Button>
        </div>
    );
}