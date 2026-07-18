import type { BasePostData } from '../components/Post/types';
import type { PostStatus, BackendPost } from '../services/postsQueryService';

export interface PendingPost extends BasePostData, Omit<BackendPost, 'status'> {
  status: PostStatus;
}
