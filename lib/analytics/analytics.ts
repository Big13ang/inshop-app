import { sendGAEvent } from '@next/third-parties/google';
import { env } from '@/env';

export type AnalyticsEventName =
  | 'view_item_list'
  | 'select_item'
  | 'view_item'
  | 'view_search_results'
  | 'view_shop'
  | 'contact_seller'
  | 'sign_up'
  | 'submit_product';

export type AnalyticsEventParams = Record<string, unknown>;

export type LoginStatus = 'unknown' | 'authenticated' | 'anonymous';

export type UserType = 'guest' | 'buyer' | 'seller';

/** Our own system user id (from `/me`); it maps 1:1 to our users and carries no personal data. */
export interface AnalyticsUser {
  id: string;
  isSeller: boolean;
}

export interface AnalyticsUserProperties {
  login_status: Exclude<LoginStatus, 'unknown'>;
  user_type: UserType;
}

/**
 * Low-level sink for analytics events. It is the only place that knows about the
 * GA4 vendor API; swap it (or inject a fake in tests) without touching any domain.
 */
export interface AnalyticsTransport {
  send: (eventName: AnalyticsEventName, params: AnalyticsEventParams) => void;
  identify: (userId: string | null, userProperties: AnalyticsUserProperties) => void;
}

function sendToGoogleAnalytics(eventName: AnalyticsEventName, params: AnalyticsEventParams) {
  if (!env.NEXT_PUBLIC_GA_ID) return;
  sendGAEvent('event', eventName, params);
}

function identifyInGoogleAnalytics(userId: string | null, userProperties: AnalyticsUserProperties) {
  if (!env.NEXT_PUBLIC_GA_ID) return;
  // `null` clears the User-ID after sign-out so the next visitor isn't merged into this user.
  sendGAEvent('set', { user_id: userId });
  sendGAEvent('set', 'user_properties', userProperties);
}

export const googleAnalyticsTransport: AnalyticsTransport = {
  send: sendToGoogleAnalytics,
  identify: identifyInGoogleAnalytics,
};

/**
 * Facade over the analytics vendor. Domain modules (auth, posts, search, shop) build
 * their events on top of `analytics.track`, so no feature code calls GA4 directly.
 */
export class AnalyticsFacade {
  private readonly transport: AnalyticsTransport;
  private loginStatus: LoginStatus = 'unknown';

  constructor(transport: AnalyticsTransport) {
    this.transport = transport;
  }

  /**
   * Sets who is viewing: a `/me` user, or `null` for an anonymous visitor.
   * Events tracked before the first call are tagged `login_status: 'unknown'`.
   */
  identify(user: AnalyticsUser | null) {
    this.loginStatus = user ? 'authenticated' : 'anonymous';
    this.transport.identify(user?.id ?? null, {
      login_status: this.loginStatus,
      user_type: getUserType(user),
    });
  }

  track(eventName: AnalyticsEventName, params: AnalyticsEventParams) {
    this.transport.send(eventName, { ...params, login_status: this.loginStatus });
  }
}

function getUserType(user: AnalyticsUser | null): UserType {
  if (!user) return 'guest';
  return user.isSeller ? 'seller' : 'buyer';
}

export const analytics = new AnalyticsFacade(googleAnalyticsTransport);
