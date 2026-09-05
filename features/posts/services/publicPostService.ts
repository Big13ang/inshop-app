import { useQuery } from '@tanstack/react-query';
import { http, Result, type ApiResponse } from '@/lib/utils';

export interface PublicPostProduct {
  name: string | null;
  imageUrl: string | null;
  link: string | null;
}

export interface PublicPostShop {
  shopName: string;
  username: string;
  bio: string | null;
  profilePhotoUrl: string | null;
  shopPhoneNumber: string | null;
  address: string | null;
}

export interface PublicPostMedia {
  id: string;
  uploadSessionId: string;
  sellerId: string;
  postId: string;
  status: string;
  storageKey: string;
  thumbnailStorageKey: string;
  mimeType: string;
  sizeBytes: number;
  order: number;
  altText: string | null;
  createdAt: string;
  updatedAt: string;
  url: string;
  thumbnailUrl: string;
}

export interface PublicPost {
  id: string;
  description: string;
  publishedAt: string;
  product: PublicPostProduct;
  shop: PublicPostShop;
  media: PublicPostMedia[];
}

export function usePublicPostById(id: string, initialData?: PublicPost | null) {
  return useQuery<PublicPost | null>({
    queryKey: ['posts', 'public-detail', id],
    queryFn: async () => {
      const resResult = await Result.try(() =>
        http.get<ApiResponse<PublicPost>>(`/posts/${id}`)
      );
      if (!resResult.ok || !resResult.value?.data) {
        return null;
      }

      return resResult.value.data;
    },
    enabled: !!id,
    initialData: initialData ?? undefined,
  });
}
