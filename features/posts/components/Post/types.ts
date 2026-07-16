import type { BackendMedia } from '../../services/postsQueryService';

export interface BasePostData {
  id: string;
  description: string;
  media?: BackendMedia[];
  createdAt: string;
  sellerName: string;
  sellerAvatar: string;
  isVerified: boolean;
}
