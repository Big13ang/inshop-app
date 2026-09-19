import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfileHeader } from '../ProfileHeader';
import { PROFILE_ROUTES } from '../../../constants';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

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

describe('ProfileHeader', () => {
  it('renders menu on right and add post button on left for owner without back button', () => {
    renderWithProviders(<ProfileHeader username="test_shop" isOwner={true} />);

    // No back button for owner on /app/profile
    expect(screen.queryByTestId('profile-back-btn')).not.toBeInTheDocument();
    expect(document.querySelector('#profile-back-btn')).toBeNull();

    // Menu button exists
    expect(document.querySelector('#profile-menu-trigger-btn')).toBeInTheDocument();

    // Add post button exists and links to new post
    const addPostBtn = document.querySelector('#profile-add-post-btn');
    expect(addPostBtn).toBeInTheDocument();
    const addPostLink = addPostBtn?.closest('a');
    expect(addPostLink).toHaveAttribute('href', PROFILE_ROUTES.newPost);

    // Title
    expect(screen.getByText('@test_shop')).toBeInTheDocument();
  });

  it('renders back button on right and no owner buttons for public visitor', () => {
    const handleBack = jest.fn();
    renderWithProviders(<ProfileHeader username="public_shop" isOwner={false} onBack={handleBack} />);

    // Back button exists
    expect(document.querySelector('#profile-back-btn')).toBeInTheDocument();

    // No menu button or add post button
    expect(document.querySelector('#profile-menu-trigger-btn')).toBeNull();
    expect(document.querySelector('#profile-add-post-btn')).toBeNull();

    // Title
    expect(screen.getByText('@public_shop')).toBeInTheDocument();
  });
});
