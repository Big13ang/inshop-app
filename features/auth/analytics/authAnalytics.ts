import { analytics } from '@/lib/analytics/analytics';

export type SignUpMethod = 'phone_otp';

export const authAnalytics = {
  signUp(method: SignUpMethod) {
    analytics.track('sign_up', { method });
  },
};
