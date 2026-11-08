import { useMediaStore } from "../services/mediaStore";
import AddPostLoadingSkeleton from "./AddPostLoadingSkeleton";
import SelectMediaPhaseView from "./SelectMediaPhaseView";
import PostDetailsPhaseView from "./PostDetailsPhaseView";

type AddPostBodyProps = {
    isSessionLoading: boolean;
};

export const AddPostBody = ({ isSessionLoading }: AddPostBodyProps) => {
    const phase = useMediaStore((s) => s.phase);

    if (isSessionLoading) {
        return <AddPostLoadingSkeleton />;
    }

    if (phase === "select") {
        return <SelectMediaPhaseView />;
    }

    return <PostDetailsPhaseView />;
};

export default AddPostBody;





