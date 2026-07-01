import type { PendingPost } from '../../features/posts/pending/types';

describe('pending posts MSW handlers', () => {
  it('removes a post from subsequent GETs after it is deleted', async () => {
    const before = (await (await fetch('/api/posts')).json()) as PendingPost[];
    const idToDelete = before[0].id;

    const deleteRes = await fetch(`/api/posts/${idToDelete}`, { method: 'DELETE' });
    expect(deleteRes.ok).toBe(true);

    const after = (await (await fetch('/api/posts')).json()) as PendingPost[];
    expect(after.map((post) => post.id)).not.toContain(idToDelete);
    expect(after).toHaveLength(before.length - 1);
  });
});
