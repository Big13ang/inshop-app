import { http } from '@/lib/utils';
import { fetchCategoryTree } from '../services/categoriesService';

jest.mock('@/lib/utils', () => {
  const actual = jest.requireActual('@/lib/utils');
  return { ...actual, http: { get: jest.fn() } };
});

const mockGet = http.get as jest.Mock;

describe('fetchCategoryTree', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('calls the public tree endpoint and returns the categories from the response envelope', async () => {
    const categories = [{ id: 'fashion', name: 'مد', parentId: null, isActive: true, isLeaf: false, selectable: false }];
    mockGet.mockResolvedValue({ success: true, data: { categories } });

    await expect(fetchCategoryTree()).resolves.toEqual(categories);
    expect(mockGet).toHaveBeenCalledWith('/categories/tree');
  });

  it('rejects when the request fails', async () => {
    mockGet.mockRejectedValue(new Error('network down'));

    await expect(fetchCategoryTree()).rejects.toThrow('network down');
  });
});
