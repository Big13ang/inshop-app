import { fireEvent, render, screen } from '@testing-library/react';
import { toast } from 'sonner';
import { setIsInternal } from '@/lib/utils/navigation';
import { useMediaStore } from '@/features/posts/new/services/mediaStore';
import { PostEditFooter } from '../PostEditFooter';

const mockSave = jest.fn();
const mockSaveCategory = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace }),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/features/post-edit/services/postEditService', () => ({
  useUpdatePostDescription: () => ({ mutate: mockSave, isPending: false }),
  useReplacePostCategories: () => ({ mutate: mockSaveCategory, isPending: false }),
}));

describe('PostEditFooter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setIsInternal(true);
    useMediaStore.setState({ caption: 'متن جدید', category: 'cat-1' });
  });

  afterEach(() => {
    useMediaStore.getState().reset();
  });

  it('saves the current caption through the update mutation', () => {
    render(<PostEditFooter postId="post-1" savedCategoryId="cat-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }));

    expect(mockSave).toHaveBeenCalledWith('متن جدید', expect.any(Object));
  });

  it('goes back to the previous page after a successful save', () => {
    mockSave.mockImplementationOnce((_caption: string, options: { onSuccess: () => void }) => options.onSuccess());

    render(<PostEditFooter postId="post-1" savedCategoryId="cat-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }));

    expect(mockBack).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('goes to the profile after a successful save when there is no previous page', () => {
    setIsInternal(false);
    mockSave.mockImplementationOnce((_caption: string, options: { onSuccess: () => void }) => options.onSuccess());

    render(<PostEditFooter postId="post-1" savedCategoryId="cat-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }));

    expect(mockReplace).toHaveBeenCalledWith('/app/profile');
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('disables save when the caption is empty', () => {
    useMediaStore.setState({ caption: '   ' });

    render(<PostEditFooter postId="post-1" savedCategoryId="cat-1" />);

    expect(screen.getByRole('button', { name: 'ذخیره' })).toBeDisabled();
  });

  describe('category', () => {
    function succeedDescription() {
      mockSave.mockImplementationOnce((_caption: string, options: { onSuccess: () => void }) => options.onSuccess());
    }

    it('does not touch the category when it is unchanged', () => {
      succeedDescription();
      render(<PostEditFooter postId="post-1" savedCategoryId="cat-1" />);

      fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }));

      expect(mockSaveCategory).not.toHaveBeenCalled();
      expect(mockBack).toHaveBeenCalled();
    });

    it('replaces the category after the caption is saved, then redirects', () => {
      useMediaStore.setState({ category: 'cat-2' });
      succeedDescription();
      mockSaveCategory.mockImplementationOnce((_ids: string[], options: { onSuccess: () => void }) => options.onSuccess());
      render(<PostEditFooter postId="post-1" savedCategoryId="cat-1" />);

      fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }));

      expect(mockSaveCategory).toHaveBeenCalledWith(['cat-2'], expect.any(Object));
      expect(mockBack).toHaveBeenCalled();
    });

    it('adds a category to a post that had none', () => {
      useMediaStore.setState({ category: 'cat-2' });
      succeedDescription();
      render(<PostEditFooter postId="post-1" savedCategoryId="" />);

      fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }));

      expect(mockSaveCategory).toHaveBeenCalledWith(['cat-2'], expect.any(Object));
    });

    it('stays on the page and reports it when only the category fails', () => {
      useMediaStore.setState({ category: 'cat-2' });
      succeedDescription();
      mockSaveCategory.mockImplementationOnce((_ids: string[], options: { onError: () => void }) => options.onError());
      render(<PostEditFooter postId="post-1" savedCategoryId="cat-1" />);

      fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }));

      expect(toast.error).toHaveBeenCalled();
      expect(mockBack).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('leaves a post without a category alone when none is picked', () => {
      useMediaStore.setState({ category: '' });
      succeedDescription();
      render(<PostEditFooter postId="post-1" savedCategoryId="" />);

      fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }));

      expect(mockSaveCategory).not.toHaveBeenCalled();
    });
  });
});
