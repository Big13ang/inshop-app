import { fireEvent, render, screen } from '@testing-library/react';
import { Categories } from '../components/Categories';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: jest.fn(), push: mockPush }),
}));

function renderExplorer() {
  return render(
    <Categories.Root>
      <Categories.Rail />
      <Categories.Panel />
    </Categories.Root>
  );
}

describe('Categories explorer', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('shows the first parent category subcategories by default', () => {
    renderExplorer();

    expect(screen.getByRole('button', { name: /کفش مردانه و رسمی/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /شمش خالص/ })).not.toBeInTheDocument();
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

  it('opens the feed filtered by parent and subcategory when a subcategory is tapped', () => {
    renderExplorer();

    fireEvent.click(screen.getByRole('button', { name: /کفش مردانه و رسمی/ }));

    expect(mockPush).toHaveBeenCalledWith(`/?cat=fashion&subcat=shoes&q=${encodeURIComponent('کفش')}`);
  });

  it('opens the feed filtered by parent when "view all" is tapped', () => {
    renderExplorer();

    fireEvent.click(screen.getByRole('button', { name: 'مشاهده همه' }));

    expect(mockPush).toHaveBeenCalledWith(`/?cat=fashion&q=${encodeURIComponent('کفش')}`);
  });
});
