import type { BasePostData } from '../components/Post/types';
import type { PostStatus } from '../services/postsQueryService';

export interface PendingPost extends BasePostData {
  status: PostStatus;
  rejectReason: string | null;
}
