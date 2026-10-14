import { analytics } from '@/lib/analytics/analytics';
import { authAnalytics } from '../authAnalytics';

describe('authAnalytics', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('tracks sign_up with the method', () => {
    const track = jest.spyOn(analytics, 'track').mockImplementation(() => {});

    authAnalytics.signUp('phone_otp');

    expect(track).toHaveBeenCalledWith('sign_up', { method: 'phone_otp' });
  });
});
