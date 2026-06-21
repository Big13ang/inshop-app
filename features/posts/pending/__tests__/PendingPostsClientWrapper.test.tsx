/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react';
import PendingPostsClientWrapper from '../PendingPostsClientWrapper';

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush, replace: jest.fn(), prefetch: jest.fn() }),
}));

let capturedOnBack: () => void;
let capturedOnAddPost: () => void;

jest.mock('../PendingPostsView', () => ({
  __esModule: true,
  default: ({ onBack, onAddPost }: { onBack: () => void; onAddPost: () => void }) => {
    capturedOnBack = onBack;
    capturedOnAddPost = onAddPost;
    return <div data-testid="pending-posts-view" />;
  },
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('PendingPostsClientWrapper', () => {
  it('renders PendingPostsView', () => {
    render(<PendingPostsClientWrapper />);
    expect(screen.getByTestId('pending-posts-view')).toBeInTheDocument();
  });

  it('navigates back via router.back when onBack is invoked', async () => {
    render(<PendingPostsClientWrapper />);

    capturedOnBack();

    expect(mockBack).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('navigates to the new post page via router.push when onAddPost is invoked', async () => {
    render(<PendingPostsClientWrapper />);

    capturedOnAddPost();

    expect(mockPush).toHaveBeenCalledWith('/app/posts/new');
    expect(mockBack).not.toHaveBeenCalled();
  });
});
