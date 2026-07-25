import { render, screen, fireEvent } from '@testing-library/react';
import PostDetailsForm from '../PostDetailsForm';
import { text } from '../../constants';

// Mock SelectedMediaSlider to focus purely on PostDetailsForm logic
jest.mock('../SelectedMediaSlider', () => {
  return function MockSelectedMediaSlider() {
    return <div data-testid="mock-selected-media-slider" />;
  };
});

describe('PostDetailsForm', () => {
  const defaultProps = {
    caption: '',
    onCaptionChange: jest.fn(),
    hasInputError: true, // safeParse returns invalid for empty string < 10 chars
    errorMessage: text.captionError,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders grayish helper text on initial page load before the user interacts with input', () => {
    render(<PostDetailsForm {...defaultProps} />);

    const textarea = screen.getByRole('textbox', { name: text.captionLabel });
    expect(textarea).toBeInTheDocument();

    const helperText = screen.getByText(text.captionHelperText);
    expect(helperText).toBeInTheDocument();
    expect(helperText).toHaveClass('text-zinc-500');
    expect(helperText).not.toHaveClass('text-red-500');
  });

  it('shows red error message when user dirties the input (types or blurs) and input is invalid', () => {
    const handleCaptionChange = jest.fn();
    render(
      <PostDetailsForm
        {...defaultProps}
        onCaptionChange={handleCaptionChange}
      />
    );

    const textarea = screen.getByRole('textbox', { name: text.captionLabel });

    // User types in textarea (dirties input)
    fireEvent.change(textarea, { target: { value: 'کم' } });
    expect(handleCaptionChange).toHaveBeenCalledWith('کم');

    const errorMsg = screen.getByText(text.captionError);
    expect(errorMsg).toBeInTheDocument();
    expect(errorMsg).toHaveClass('text-red-500');
  });

  it('shows red error message when user blurs the untouched input', () => {
    render(<PostDetailsForm {...defaultProps} />);

    const textarea = screen.getByRole('textbox', { name: text.captionLabel });

    // User focuses and blurs without typing (dirties input)
    fireEvent.blur(textarea);

    const errorMsg = screen.getByText(text.captionError);
    expect(errorMsg).toBeInTheDocument();
    expect(errorMsg).toHaveClass('text-red-500');
  });

  it('renders grayish helper text when input is valid (hasInputError is false)', () => {
    render(
      <PostDetailsForm
        {...defaultProps}
        caption="توضیحات محصول کامل و معتبر است"
        hasInputError={false}
        errorMessage={undefined}
      />
    );

    const textarea = screen.getByRole('textbox', { name: text.captionLabel });
    fireEvent.change(textarea, { target: { value: 'توضیحات محصول کامل و معتبر است' } });

    const helperText = screen.getByText(text.captionHelperText);
    expect(helperText).toBeInTheDocument();
    expect(helperText).toHaveClass('text-zinc-500');
  });
});
