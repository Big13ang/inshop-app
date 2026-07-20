/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { storageKeys } from '@/lib/constants/storageKeys';
import AddPostOnboardingSheet from '../components/AddPostOnboardingSheet';

const STORAGE_KEY = storageKeys.localStorage.posts.addPostOnboardingSeen;

const TITLE = 'فروشنده گرامی، خوش آمدید.';
const CTA = 'متوجه شدم';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('AddPostOnboardingSheet', () => {
  it('shows the sheet on first visit when the seen key is absent', () => {
    render(<AddPostOnboardingSheet />);
    expect(screen.getByText(TITLE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: CTA })).toBeInTheDocument();
  });

  it('does NOT render the sheet when the seen key is already set', () => {
    localStorage.setItem(STORAGE_KEY, '1');
    render(<AddPostOnboardingSheet />);
    expect(screen.queryByText(TITLE)).not.toBeInTheDocument();
  });

  it('sets the localStorage key when the CTA button is clicked', async () => {
    const user = userEvent.setup();
    render(<AddPostOnboardingSheet />);

    await user.click(screen.getByRole('button', { name: CTA }));

    expect(localStorage.getItem(STORAGE_KEY)).toBe('1');
  });

  it('sets the localStorage key when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(<AddPostOnboardingSheet />);

    await user.click(screen.getByTestId('dialog-backdrop'));

    expect(localStorage.getItem(STORAGE_KEY)).toBe('1');
  });

  it('does not show the sheet on re-mount after the user has dismissed it', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<AddPostOnboardingSheet />);

    await user.click(screen.getByRole('button', { name: CTA }));
    unmount();

    // On next mount localStorage already has the key
    render(<AddPostOnboardingSheet />);
    expect(screen.queryByText(TITLE)).not.toBeInTheDocument();
  });
});
