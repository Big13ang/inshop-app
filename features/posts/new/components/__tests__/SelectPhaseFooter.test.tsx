import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import SelectPhaseFooter from '../SelectPhaseFooter';
import AddPostBody from '../AddPostBody';
import { useMediaStore } from '../../services/mediaStore';
import { text } from '../../constants';
import type { MediaItem } from '../../types';

function createMockMediaItem(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: `media-${Math.random().toString(36).slice(2, 9)}`,
    file: new File([], 'test.jpg', { type: 'image/jpeg' }),
    previewUrl: 'blob:http://localhost/test',
    status: 'uploaded',
    kind: 'image',
    isValid: true,
    order: 1,
    uploadProgress: 100,
    serverMediaId: null,
    ...overrides,
  };
}

describe('SelectPhaseFooter Component (Behavior)', () => {
  beforeEach(() => {
    useMediaStore.getState().reset();
    jest.clearAllMocks();
  });

  describe('Next Button Disabled & Action Guards', () => {
    it('disables Next button while an upload is pending or in progress', () => {
      useMediaStore.getState().setMediaList([
        createMockMediaItem({ status: 'uploading' }),
      ]);

      render(
        <SelectPhaseFooter
          isSessionLoading={false}
          onTriggerPicker={jest.fn()}
        />
      );

      const nextBtn = screen.getByRole('button', { name: /بعدی/ });
      expect(nextBtn).toBeDisabled();
    });

    it('disables Next button while upload session is initializing', () => {
      useMediaStore.getState().setMediaList([
        createMockMediaItem({ status: 'uploaded' }),
      ]);

      render(
        <SelectPhaseFooter
          isSessionLoading={true}
          onTriggerPicker={jest.fn()}
        />
      );

      const nextBtn = screen.getByRole('button', { name: /بعدی/ });
      expect(nextBtn).toBeDisabled();
    });

    it('disables Next button while batch file validation is running', () => {
      useMediaStore.getState().setIsValidating(true);

      render(
        <SelectPhaseFooter
          isSessionLoading={false}
          onTriggerPicker={jest.fn()}
        />
      );

      const nextBtn = screen.getByRole('button', { name: /بعدی/ });
      expect(nextBtn).toBeDisabled();
    });
  });

  describe('Next Button User Feedback & Flow Progression', () => {
    it('shows warning toast and prevents advancing when clicking Next without any selected image', async () => {
      const user = userEvent.setup();
      useMediaStore.getState().setMediaList([]);

      render(
        <>
          <AddPostBody isSessionLoading={false} />
          <SelectPhaseFooter
            isSessionLoading={false}
            onTriggerPicker={jest.fn()}
          />
        </>
      );

      const nextBtn = screen.getByRole('button', { name: /بعدی/ });
      expect(nextBtn).toBeEnabled();

      await user.click(nextBtn);

      // User observes the warning toast
      expect(toast.warning).toHaveBeenCalledWith(text.alertNoImages);
      // User is still on the selection phase (empty gallery text still visible)
      expect(screen.getAllByText('تصویری انتخاب نشده').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('advances user to the post details caption screen when Next is clicked with a valid image', async () => {
      const user = userEvent.setup();
      useMediaStore.getState().setMediaList([
        createMockMediaItem({ status: 'uploaded', order: 1 }),
      ]);

      render(
        <>
          <AddPostBody isSessionLoading={false} />
          <SelectPhaseFooter
            isSessionLoading={false}
            onTriggerPicker={jest.fn()}
          />
        </>
      );

      const nextBtn = screen.getByRole('button', { name: /بعدی/ });
      await user.click(nextBtn);

      // User observes the post details screen (caption textarea becomes visible)
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Add Button Accessibility & Limits', () => {
    it('disables Add button when 10 images quota limit is reached', () => {
      const tenItems = Array.from({ length: 10 }, (_, i) =>
        createMockMediaItem({ id: `item-${i + 1}` })
      );
      useMediaStore.getState().setMediaList(tenItems);

      render(
        <SelectPhaseFooter
          isSessionLoading={false}
          onTriggerPicker={jest.fn()}
        />
      );

      const addBtn = screen.getByRole('button', { name: /اضافه کردن/ });
      expect(addBtn).toBeDisabled();
    });

    it('enables Add button and triggers picker callback on click when below limit', async () => {
      const user = userEvent.setup();
      const mockTrigger = jest.fn();

      render(
        <SelectPhaseFooter
          isSessionLoading={false}
          onTriggerPicker={mockTrigger}
        />
      );

      const addBtn = screen.getByRole('button', { name: /اضافه کردن/ });
      expect(addBtn).toBeEnabled();

      await user.click(addBtn);

      expect(mockTrigger).toHaveBeenCalledTimes(1);
    });
  });
});
