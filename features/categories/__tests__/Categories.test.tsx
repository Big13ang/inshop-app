import { fireEvent, render, screen } from '@testing-library/react';
import { Categories } from '../components/Categories';
import type { CategoryNode } from '../types';

const mockPush = jest.fn();
const mockUseCategoryTree = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: jest.fn(), push: mockPush }),
}));

jest.mock('../services/categoriesService', () => ({
  useCategoryTree: () => mockUseCategoryTree(),
}));

function category(id: string, name: string, parentId: string | null, isActive = true): CategoryNode {
  return { id, name, parentId, isActive, isLeaf: parentId !== null, selectable: parentId !== null && isActive };
}

const CATEGORY_TREE: CategoryNode[] = [
  category('cat-fashion', 'مد و پوشاک', null),
  category('cat-shoes', 'کفش مردانه و رسمی', 'cat-fashion'),
  category('cat-bags', 'کیف و کوله‌پشتی', 'cat-fashion'),
  category('cat-old-boots', 'بوت قدیمی', 'cat-fashion', false),
  category('cat-gold', 'طلا و زیورآلات', null),
  category('cat-bullion', 'شمش خالص', 'cat-gold'),
  category('cat-digital', 'کالای دیجیتال', null),
  category('cat-phones', 'گوشی موبایل', 'cat-digital'),
  category('cat-retired', 'دسته حذف‌شده', null, false),
];

function renderExplorer() {
  return render(
    <Categories.Root>
      <Categories.Rail />
      <Categories.Panel />
    </Categories.Root>
  );
}

function mockTreeReady(categories: CategoryNode[] = CATEGORY_TREE) {
  mockUseCategoryTree.mockReturnValue({ data: categories, isPending: false, isError: false });
}

describe('Categories explorer', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockTreeReady();
  });

  it('shows the first active parent category subcategories by default', () => {
    renderExplorer();

    expect(screen.getByRole('button', { name: /کفش مردانه و رسمی/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /شمش خالص/ })).not.toBeInTheDocument();
  });

  it('hides inactive parents and inactive subcategories', () => {
    renderExplorer();

    expect(screen.queryByRole('button', { name: /دسته حذف‌شده/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /بوت قدیمی/ })).not.toBeInTheDocument();
  });

  it('switches the subcategory list when another parent is selected in the rail', () => {
    renderExplorer();

    fireEvent.click(screen.getByRole('button', { name: /طلا و زیورآلات/ }));

    expect(screen.getByRole('button', { name: /شمش خالص/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /کفش مردانه و رسمی/ })).not.toBeInTheDocument();
  });

  it('marks the selected rail item as pressed', () => {
    renderExplorer();

    fireEvent.click(screen.getByRole('button', { name: /کالای دیجیتال/ }));

    expect(screen.getByRole('button', { name: /کالای دیجیتال/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /مد و پوشاک/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('opens the subcategory posts page when a subcategory is tapped', () => {
    renderExplorer();

    fireEvent.click(screen.getByRole('button', { name: /کفش مردانه و رسمی/ }));

    expect(mockPush).toHaveBeenCalledWith('/categories/cat-shoes');
  });

  it('opens the parent category posts page when "view all" is tapped', () => {
    renderExplorer();

    fireEvent.click(screen.getByRole('button', { name: 'مشاهده همه' }));

    expect(mockPush).toHaveBeenCalledWith('/categories/cat-fashion');
  });

  it('shows a loading message while the tree is pending', () => {
    mockUseCategoryTree.mockReturnValue({ data: undefined, isPending: true, isError: false });
    renderExplorer();

    expect(screen.getByText('در حال بارگذاری دسته‌بندی‌ها…')).toBeInTheDocument();
  });

  it('shows an error message when the tree fails to load', () => {
    mockUseCategoryTree.mockReturnValue({ data: undefined, isPending: false, isError: true });
    renderExplorer();

    expect(screen.getByText('بارگذاری دسته‌بندی‌ها انجام نشد')).toBeInTheDocument();
  });

  it('shows an empty message when the tree has no active parents', () => {
    mockTreeReady([]);
    renderExplorer();

    expect(screen.getByText('دسته‌بندی‌ای برای نمایش وجود ندارد')).toBeInTheDocument();
  });
});
