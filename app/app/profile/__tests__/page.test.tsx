import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfilePage from '../page';
import EditProfilePage from '../edit/page';

jest.mock('@/features/profile/overview/ProfileView', () => ({
  __esModule: true,
  default: () => <div data-testid="profile-view" />,
}));

jest.mock('@/features/profile/edit/EditProfileClientWrapper', () => ({
  __esModule: true,
  default: () => <div data-testid="edit-profile-view" />,
}));

describe('ProfilePage', () => {
  it('renders the profile overview behind a Suspense boundary', async () => {
    render(<ProfilePage />);

    expect(await screen.findByTestId('profile-view')).toBeInTheDocument();
  });
});

describe('EditProfilePage', () => {
  it('renders the edit form behind a Suspense boundary', async () => {
    render(<EditProfilePage />);

    expect(await screen.findByTestId('edit-profile-view')).toBeInTheDocument();
  });
});
