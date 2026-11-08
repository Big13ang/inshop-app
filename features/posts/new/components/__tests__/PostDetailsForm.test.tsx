import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PostDetailsForm from '../PostDetailsForm';
import PostDetailsPhaseView from '../PostDetailsPhaseView';
import { useMediaStore } from '../../services/mediaStore';
import { text } from '../../constants';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import type { MediaItem } from '../../types';

function createMockMediaItem(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: `item-${Math.random().toString(36).slice(2, 8)}`,
    file: new File([], 'photo.jpg', { type: 'image/jpeg' }),
    previewUrl: 'blob:http://localhost/test',
    status: 'uploaded',
    kind: 'image',
    isValid: true,
    order: 1,
    uploadProgress: 100,
    serverMediaId: 'srv-1',
    ...overrides,
  };
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('PostDetailsForm & Phase View (Behavior)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMediaStore.getState().reset();
  });

  describe('PostDetailsForm Presentation & Interaction', () => {
    it('renders caption textarea with accessible label, placeholder, and helper text', () => {
      render(
        <PostDetailsForm
          caption=""
          onCaptionChange={jest.fn()}
          hasInputError={false}
        />
      );

      const textarea = screen.getByRole('textbox', { name: text.captionLabel });
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('placeholder', text.captionPlaceholder);
      expect(screen.getByText(text.captionHelperText)).toBeInTheDocument();
    });

    it('displays compact slider preview with selected media items', () => {
      useMediaStore.getState().setMediaList([
        createMockMediaItem({ id: 'img-1', order: 1 }),
      ]);

      render(
        <PostDetailsForm
          caption=""
          onCaptionChange={jest.fn()}
          hasInputError={false}
        />
      );

      expect(screen.getByText(/فایل.*1.*از.*1/)).toBeInTheDocument();
    });

    it('does not show validation error message before user touches or blurs the input', () => {
      render(
        <PostDetailsForm
          caption=""
          onCaptionChange={jest.fn()}
          hasInputError={true}
          errorMessage="متن خطا"
        />
      );

      const textarea = screen.getByRole('textbox', { name: text.captionLabel });
      expect(textarea).not.toHaveClass('border-red-400');
      expect(screen.queryByText('متن خطا')).not.toBeInTheDocument();
    });

    it('shows validation error message after user types and leaves input dirty with error', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <PostDetailsForm
          caption="abc"
          onCaptionChange={handleChange}
          hasInputError={true}
          errorMessage="متن خطا"
        />
      );

      const textarea = screen.getByRole('textbox', { name: text.captionLabel });
      await user.click(textarea);
      await user.tab();

      expect(textarea).toHaveClass('border-red-400');
      expect(screen.getByText('متن خطا')).toBeInTheDocument();
    });

    it('notifies parent onCaptionChange as user types', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <PostDetailsForm
          caption=""
          onCaptionChange={handleChange}
          hasInputError={false}
        />
      );

      const textarea = screen.getByRole('textbox', { name: text.captionLabel });
      await user.type(textarea, 'کفش');

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('PostDetailsPhaseView Schema Validation Integration', () => {
    it('validates caption length and dynamically toggles error state on input', async () => {
      const user = userEvent.setup();

      renderWithProviders(<PostDetailsPhaseView />);

      const textarea = screen.getByRole('textbox', { name: text.captionLabel });

      // Initially no error style is active
      expect(textarea).not.toHaveClass('border-red-400');
      expect(document.querySelector('.text-red-500')).toBeNull();

      // Type too short a caption (< 10 chars) and blur
      await user.type(textarea, 'کفش');
      await user.tab();

      // Error style is active because input is dirty and too short
      expect(textarea).toHaveClass('border-red-400');
      const errorSpan = document.querySelector('.text-red-500');
      expect(errorSpan).not.toBeNull();
      expect(errorSpan?.textContent).toBe(ERROR_MESSAGES.validation.minCaptionLength(10));

      // Now complete the caption to >= 10 chars
      await user.type(textarea, ' اسپورت مردانه شیک');

      // Error style is removed
      expect(textarea).not.toHaveClass('border-red-400');
      expect(document.querySelector('.text-red-500')).toBeNull();
    });
  });
});
