/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AddPostClientWrapper from '../AddPostClientWrapper';
import { text } from '../constants';

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush, replace: jest.fn(), prefetch: jest.fn() }),
}));

afterEach(() => {
  mockBack.mockClear();
  mockPush.mockClear();
});

const renderWithProviders = () => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AddPostClientWrapper />
    </QueryClientProvider>,
  );
};

describe('AddPostClientWrapper', () => {
  it('renders AddPostView', () => {
    renderWithProviders();
    expect(screen.getByText(text.headerTitle)).toBeInTheDocument();
  });

  it('uses the global back button home behavior when leaving the select phase', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders();

    const backBtn = container.querySelector('#add-post-back-btn') as HTMLButtonElement;
    await user.click(backBtn);

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
