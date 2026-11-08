import { fireEvent, render, screen } from '@testing-library/react';
import { useMediaStore } from '@/features/posts/new/services/mediaStore';
import { PostEditFooter } from '../PostEditFooter';

const mockSave = jest.fn();
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: jest.fn(), push: mockPush }),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/features/post-edit/services/postEditService', () => ({
  useUpdatePostDescription: () => ({ mutate: mockSave, isPending: false }),
}));

describe('PostEditFooter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMediaStore.setState({ caption: 'متن جدید' });
  });

  afterEach(() => {
    useMediaStore.getState().reset();
  });

  it('saves the current caption through the update mutation', () => {
    render(<PostEditFooter postId="post-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }));

    expect(mockSave).toHaveBeenCalledWith('متن جدید', expect.any(Object));
  });

  it('redirects to the pending review page after a successful save', () => {
    mockSave.mockImplementationOnce((_caption: string, options: { onSuccess: () => void }) => options.onSuccess());

    render(<PostEditFooter postId="post-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }));

    expect(mockPush).toHaveBeenCalledWith('/app/posts/pending');
  });

  it('disables save when the caption is empty', () => {
    useMediaStore.setState({ caption: '   ' });

    render(<PostEditFooter postId="post-1" />);

    expect(screen.getByRole('button', { name: 'ذخیره' })).toBeDisabled();
  });
});
