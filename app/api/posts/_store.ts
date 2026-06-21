// MOCK STORE - FOR DEVELOPMENT AND MANUAL TESTING ONLY
// In-module state shared by the dev-only /api/posts mock routes.

import type { PendingPost } from '@/features/posts/pending/types';
import { createPendingPostsFixture } from '@/mocks/fixtures';

export const posts: PendingPost[] = createPendingPostsFixture();
