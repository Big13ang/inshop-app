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

    const content = image ? (
        <img
            src={image}
            alt={post.description || 'تصویر محصول'}
            className="w-full h-full object-cover animate-fade-in"
        />
    ) : (
        <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800" />
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