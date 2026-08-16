/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import type { SellerPost, BackendMedia } from '@/features/posts/services/postsQueryService';
import { getMediaUrl } from '@/lib/utils';

interface Props {
    post: SellerPost;
    onClick?: (id: string) => void;
}

export default function ProfileGridItem({ post, onClick }: Props) {
    const images = getImages(post);
    const image = images[0];

    const content = (
        <>
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
        </>
    );

    const className = "aspect-square overflow-hidden bg-surface relative block cursor-pointer outline-none focus:ring-1 focus:ring-zinc-800";

    if (onClick) {
        return (
            <button
                type="button"
                onClick={() => onClick(String(post.id))}
                className={className}
            >
                {content}
            </button>
        );
    }

    return (
        <Link href={`/p/${post.id}`} className={className}>
            {content}
        </Link>
    );
}

function getImages(post: SellerPost) {
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