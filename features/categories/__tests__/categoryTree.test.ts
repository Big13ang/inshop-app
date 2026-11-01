import type { CategoryNode } from '../types';
import { getActiveChildren, getActiveRoots } from '../utils/categoryTree';

function category(id: string, parentId: string | null, isActive = true): CategoryNode {
  return { id, name: id, parentId, isActive, isLeaf: parentId !== null, selectable: parentId !== null && isActive };
}

const TREE: CategoryNode[] = [
  category('fashion', null),
  category('shoes', 'fashion'),
  category('old-boots', 'fashion', false),
  category('retired', null, false),
  category('gold', null),
];

describe('categoryTree helpers', () => {
  it('returns only active root categories', () => {
    expect(getActiveRoots(TREE).map((node) => node.id)).toEqual(['fashion', 'gold']);
  });

  it('returns only active direct children of the given parent', () => {
    expect(getActiveChildren(TREE, 'fashion').map((node) => node.id)).toEqual(['shoes']);
  });

  it('returns an empty list when the parent has no children', () => {
    expect(getActiveChildren(TREE, 'gold')).toEqual([]);
  });
});
