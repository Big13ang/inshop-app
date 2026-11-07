import { fireEvent, render, screen } from '@testing-library/react';
import { PostCategoryField } from '../PostCategoryField';
import { useMediaStore } from '../../services/mediaStore';
import type { CategoryNode } from '@/features/categories/types';

const mockUseCategoryTree = jest.fn();
jest.mock('@/features/categories/services/categoriesService', () => ({
  useCategoryTree: () => mockUseCategoryTree(),
}));

function node(overrides: Partial<CategoryNode>): CategoryNode {
  return { id: 'x', name: 'x', parentId: null, isActive: true, isLeaf: true, selectable: true, ...overrides };
}

describe('PostCategoryField', () => {
  beforeEach(() => {
    useMediaStore.getState().reset();
    mockUseCategoryTree.mockReturnValue({
      isPending: false,
      data: [
        node({ id: 'digital', name: 'کالای دیجیتال', isLeaf: false, selectable: false }),
        node({ id: 'mobile', name: 'موبایل', parentId: 'digital' }),
        node({ id: 'laptop', name: 'لپ تاپ', parentId: 'digital' }),
        node({ id: 'hidden', name: 'قدیمی', parentId: 'digital', isActive: false }),
        node({ id: 'books', name: 'کتاب' }),
        node({ id: 'health', name: 'بهداشتی', isLeaf: false, selectable: false }),
        node({ id: 'wellness', name: 'سلامتی', parentId: 'health', isLeaf: false, selectable: false }),
        node({ id: 'dead', name: 'سام سرویس', parentId: 'wellness', isActive: false, selectable: false }),
      ],
    });
  });

  it('drills from category to sub-category in one sheet, then selects and closes', () => {
    render(<PostCategoryField />);

    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: /کالای دیجیتال/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'موبایل' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('option', { name: /کالای دیجیتال/ }));
    expect(screen.getByRole('option', { name: 'موبایل' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'قدیمی' })).not.toBeInTheDocument();
    expect(useMediaStore.getState().category).toBe('');

    fireEvent.click(screen.getByRole('option', { name: 'موبایل' }));
    expect(useMediaStore.getState().category).toBe('mobile');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveTextContent('کالای دیجیتالموبایل');
  });

  it('goes back to the top level from a sub-category list', () => {
    render(<PostCategoryField />);

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: /کالای دیجیتال/ }));
    fireEvent.click(screen.getByRole('button', { name: 'بازگشت' }));

    expect(screen.getByRole('option', { name: 'کتاب' })).toBeInTheDocument();
  });

  it('hides categories whose branch has nothing selectable', () => {
    render(<PostCategoryField />);

    fireEvent.click(screen.getByRole('combobox'));

    expect(screen.queryByRole('option', { name: /بهداشتی/ })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'کتاب' })).toBeInTheDocument();
  });

  it('shows an error with retry when categories fail to load', () => {
    const refetch = jest.fn();
    mockUseCategoryTree.mockReturnValue({ isPending: false, isError: true, data: undefined, refetch });
    render(<PostCategoryField />);

    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'تلاش دوباره' }));
    expect(refetch).toHaveBeenCalled();
  });
});
