import type { CategoryNode } from '@/features/categories/types';
import { getCategoryPath, hasSelectableBranch } from '../categoryPath';

function node(overrides: Partial<CategoryNode>): CategoryNode {
  return { id: 'x', name: 'x', parentId: null, isActive: true, isLeaf: true, selectable: true, ...overrides };
}

const TREE = [
  node({ id: 'root', isLeaf: false, selectable: false }),
  node({ id: 'child', parentId: 'root' }),
  node({ id: 'dead-root', isLeaf: false, selectable: false }),
  node({ id: 'dead-child', parentId: 'dead-root', isActive: false, selectable: false }),
];

describe('getCategoryPath', () => {
  it('returns the chain from root to the category', () => {
    expect(getCategoryPath(TREE, 'child').map((n) => n.id)).toEqual(['root', 'child']);
  });

  it('returns an empty path for an unknown id', () => {
    expect(getCategoryPath(TREE, 'missing')).toEqual([]);
  });
});

describe('hasSelectableBranch', () => {
  it('is true for a selectable node and for a parent of one', () => {
    expect(hasSelectableBranch(TREE, TREE[1])).toBe(true);
    expect(hasSelectableBranch(TREE, TREE[0])).toBe(true);
  });

  it('is false when only inactive descendants exist', () => {
    expect(hasSelectableBranch(TREE, TREE[2])).toBe(false);
  });
});
