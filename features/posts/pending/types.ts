import type { BasePostData } from '../components/Post/types';

export type PendingPostStatus = 'pending' | 'rejected' | 'approved';

export interface PendingPost extends BasePostData {
  status: PendingPostStatus;
  rejectionReason?: string;
  title: string;
}
