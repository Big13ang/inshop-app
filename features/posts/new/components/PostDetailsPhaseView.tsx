import { useMediaStore } from "../services/mediaStore";
import { postBodySchema } from "../schemas/postSchema";
import PostDetailsForm from "./PostDetailsForm";

export const PostDetailsPhaseView = () => {
    const caption = useMediaStore((s) => s.caption);
    const setCaption = useMediaStore((s) => s.setCaption);

    const result = postBodySchema.safeParse({ caption });
    const errorMessage = !result.success ? result.error.issues[0]?.message : undefined;

    const handleCaptionChange = (val: string) => {
        setCaption(val);
    };

    return (
        <div className="flex-1 overflow-y-auto flex flex-col pb-20">
            <PostDetailsForm
                caption={caption}
                onCaptionChange={handleCaptionChange}
                hasInputError={!!errorMessage}
                errorMessage={errorMessage}
            />
        </div>
    );
};


export default PostDetailsPhaseView;
