/// <reference types="@testing-library/jest-dom" />
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AddPostClientWrapper from '../AddPostClientWrapper';
import { text } from '../constants';
import { queryKeys } from '@/lib/query-keys';
import { useMediaStore } from '../services/mediaStore';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockGoBackSafely = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush, replace: mockReplace, prefetch: jest.fn() }),
  usePathname: () => '/posts/new',
}));

jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  goBackSafely: (router: unknown) => mockGoBackSafely(router),
}));

afterEach(() => {
  mockBack.mockClear();
  mockPush.mockClear();
  mockReplace.mockClear();
  mockGoBackSafely.mockClear();
  useMediaStore.getState().reset();
});

const renderWithProviders = () => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const result = render(
    <QueryClientProvider client={client}>
      <AddPostClientWrapper />
    </QueryClientProvider>,
  );

  return { ...result, client };
};

describe('AddPostClientWrapper', () => {
  it('renders AddPostView', () => {
    renderWithProviders();
    expect(screen.getByText(text.headerTitle)).toBeInTheDocument();
  });

  it('replaces with home when leaving the select phase', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders();

    const backBtn = container.querySelector('#add-post-back-btn') as HTMLButtonElement;
    await user.click(backBtn);

    expect(mockGoBackSafely).toHaveBeenCalled();
  });

  it('resets the media store state when leaving the route', () => {
    const { unmount } = renderWithProviders();

    act(() => {
      useMediaStore.getState().setPhase('details');
      useMediaStore.getState().setCaption('test');
    });

    unmount();

    expect(useMediaStore.getState().phase).toBe('select');
    expect(useMediaStore.getState().caption).toBe('');
  });
});
