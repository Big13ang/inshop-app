import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from '@/lib/utils';
import { useMediaStore } from '../mediaStore';
import { useUploadSession } from '../uploadSession';

jest.mock('@/lib/utils', () => {
  const actual = jest.requireActual('@/lib/utils');
  return { ...actual, http: { post: jest.fn() } };
});

const mockPost = http.post as jest.Mock;

type Answer = (id: string) => void;

/** Each POST /upload-sessions stays pending until the test answers it. */
function holdSessionRequests() {
  const answers: Answer[] = [];
  mockPost.mockImplementation(
    () =>
      new Promise((resolve) => {
        answers.push((id) => resolve({ data: { uploadSessionId: id, expiresAt: '2099-01-01T00:00:00Z' } }));
      }),
  );
  return answers;
}

function renderSessionHooks(count: number) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  // The add-post page uses the hook in several components at once.
  return Array.from({ length: count }, () => renderHook(useUploadSession, { wrapper }));
}

describe('useUploadSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMediaStore.getState().reset();
  });

  it('keeps the first session that arrives when more than one request was made', async () => {
    const answers = holdSessionRequests();
    renderSessionHooks(3);
    await waitFor(() => expect(answers.length).toBeGreaterThan(1));

    act(() => answers[1]('second-request'));
    await waitFor(() => expect(useMediaStore.getState().uploadSessionId).toBe('second-request'));

    // A late answer must not replace the session that files may already be uploading into.
    act(() => {
      for (const [i, answer] of answers.entries()) {
        if (i !== 1) answer(`late-${i}`);
      }
    });
    await act(async () => {});

    expect(useMediaStore.getState().uploadSessionId).toBe('second-request');
  });

  it('gives every component the same session', async () => {
    const answers = holdSessionRequests();
    const hooks = renderSessionHooks(3);
    await waitFor(() => expect(answers.length).toBeGreaterThan(0));

    act(() => {
      for (const [i, answer] of answers.entries()) answer(`session-${i}`);
    });
    await waitFor(() => expect(useMediaStore.getState().uploadSessionId).not.toBeNull());

    const stored = useMediaStore.getState().uploadSessionId;
    for (const hook of hooks) {
      expect(hook.result.current.data?.uploadSessionId).toBe(stored);
    }
  });

  it('asks for a new session after the store is reset (a new post)', async () => {
    const answers = holdSessionRequests();
    renderSessionHooks(1);
    await waitFor(() => expect(answers.length).toBe(1));
    act(() => answers[0]('first-post'));
    await waitFor(() => expect(useMediaStore.getState().uploadSessionId).toBe('first-post'));

    act(() => useMediaStore.getState().reset());
    await waitFor(() => expect(answers.length).toBeGreaterThan(1));
    act(() => answers[answers.length - 1]('second-post'));

    await waitFor(() => expect(useMediaStore.getState().uploadSessionId).toBe('second-post'));
  });
});
