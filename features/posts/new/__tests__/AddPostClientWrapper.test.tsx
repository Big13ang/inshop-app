/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react';
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

  it('resets the draft upload session when leaving the route', () => {
    const { client, unmount } = renderWithProviders();

    useMediaStore.getState().setUploadSession('session-to-clear', '2026-07-21T00:00:00Z');
    client.setQueryData(queryKeys.posts.uploadSession(), {
      uploadSessionId: 'session-to-clear',
      expiresAt: '2026-07-21T00:00:00Z',
    });

    unmount();

    expect(useMediaStore.getState().uploadSessionId).toBeNull();
    expect(client.getQueryData(queryKeys.posts.uploadSession())).toBeUndefined();
  });
});
