/* eslint-disable @next/next/no-img-element */
import type { BackendPost, BackendMedia } from '@/features/posts/services/postsQueryService';
import { getMediaUrl } from '@/features/posts/utils/media';

interface Props {
    post: BackendPost;
    onClick?: (id: string) => void;
}

export default function ProfileGridItem({ post, onClick }: Props) {
    const images = getImages(post);
    const image = images[0];

    return (
        <button
            type="button"
            onClick={() => onClick?.(String(post.id))}
            className="
        aspect-square
        overflow-hidden
        bg-surface
        relative
        cursor-pointer
        outline-none
        focus:ring-1
        focus:ring-zinc-800
      "
        >
            {image ? (
                <img
                    src={image}
                    alt={post.description || 'تصویر محصول'}
                    className="w-full h-full object-cover animate-fade-in"
                />
            ) : (
                <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800" />
            )}

            {images.length > 1 && <MultipleImagesBadge />}
        </button>
    );
}

function getImages(post: BackendPost) {
    return (
        post.media
            ?.map((media: BackendMedia) => getMediaUrl(media))
            .filter(Boolean) ?? []
    );
}

function MultipleImagesBadge() {
    return (
        <div className="absolute top-1.5 right-1.5 bg-black/60 p-1.5 rounded-md text-white">
            <svg
                className="w-3 h-3"
                fill="currentColor"
                viewBox="0 0 24 24"
            >
                <path d="M19 2H8a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V4a2 2 0 00-2-2zm-1 12H9V5h9v9zM6 6H4v12a2 2 0 002 2h12v-2H6V6z" />
            </svg>
        </div>
    );
}