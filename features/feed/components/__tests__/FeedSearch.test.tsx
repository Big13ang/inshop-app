import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedSearch } from '../FeedSearch';

jest.mock('@/features/search/components/InShopSearchResult', () => ({
  InShopSearchResult: ({ query }: { query: string }) => (
    <div data-testid="inshop-search-result">Query: {query}</div>
  ),
}));

describe('FeedSearch component', () => {
  it('renders search input and feed children initially', () => {
    render(
      <FeedSearch>
        <div data-testid="feed-children">Feed Content</div>
      </FeedSearch>
    );

    const input = screen.getByPlaceholderText('برای جستجو بنویسید ...');
    expect(input).toBeInTheDocument();
    expect(screen.getByTestId('feed-children')).toBeInTheDocument();
    expect(screen.queryByTestId('inshop-search-result')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('پاک کردن جستجو')).not.toBeInTheDocument();
  });

  it('allows user to input spaces between words and preserves spaces', async () => {
    const user = userEvent.setup();
    render(
      <FeedSearch>
        <div data-testid="feed-children">Feed Content</div>
      </FeedSearch>
    );

    const input = screen.getByPlaceholderText('برای جستجو بنویسید ...') as HTMLInputElement;

    await user.type(input, 'کفش ورزشی');

    expect(input.value).toBe('کفش ورزشی');
  });

  it('allows entering trailing space without trimming', async () => {
    const user = userEvent.setup();
    render(
      <FeedSearch>
        <div data-testid="feed-children">Feed Content</div>
      </FeedSearch>
    );

    const input = screen.getByPlaceholderText('برای جستجو بنویسید ...') as HTMLInputElement;

    await user.type(input, 'کفش ');

    expect(input.value).toBe('کفش ');
  });

  it('allows typing space as initial input', async () => {
    const user = userEvent.setup();
    render(
      <FeedSearch>
        <div data-testid="feed-children">Feed Content</div>
      </FeedSearch>
    );

    const input = screen.getByPlaceholderText('برای جستجو بنویسید ...') as HTMLInputElement;

    await user.type(input, ' ');

    expect(input.value).toBe(' ');
  });

  it('clears the search input when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FeedSearch>
        <div data-testid="feed-children">Feed Content</div>
      </FeedSearch>
    );

    const input = screen.getByPlaceholderText('برای جستجو بنویسید ...') as HTMLInputElement;

    await user.type(input, 'شلوار لی');
    expect(input.value).toBe('شلوار لی');

    const clearButton = screen.getByLabelText('پاک کردن جستجو');
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);

    expect(input.value).toBe('');
    expect(screen.queryByLabelText('پاک کردن جستجو')).not.toBeInTheDocument();
    expect(screen.getByTestId('feed-children')).toBeInTheDocument();
  });
});
