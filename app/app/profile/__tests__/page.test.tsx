import { redirect } from 'next/navigation';
import ProfilePage from '../page';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('ProfilePage', () => {
  it('redirects to /app/posts/pending', () => {
    ProfilePage();
    expect(redirect).toHaveBeenCalledWith('/app/posts/pending');
  });
});
