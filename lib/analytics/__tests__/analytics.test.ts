import { sendGAEvent } from '@next/third-parties/google';
import { env } from '@/env';
import { AnalyticsFacade, googleAnalyticsTransport, type AnalyticsTransport } from '../analytics';

jest.mock('@next/third-parties/google', () => ({
  sendGAEvent: jest.fn(),
}));

function createFacade() {
  const transport: AnalyticsTransport = { send: jest.fn(), identify: jest.fn() };
  return { facade: new AnalyticsFacade(transport), transport };
}

describe('AnalyticsFacade', () => {
  it('tags events as unknown before the viewer is identified', () => {
    const { facade, transport } = createFacade();

    facade.track('sign_up', { method: 'phone_otp' });

    expect(transport.send).toHaveBeenCalledWith('sign_up', { method: 'phone_otp', login_status: 'unknown' });
  });

  it('identifies an authenticated buyer with the /me user id', () => {
    const { facade, transport } = createFacade();

    facade.identify({ id: 'user-uuid', isSeller: false });
    facade.track('view_item', { items: [] });

    expect(transport.identify).toHaveBeenCalledWith('user-uuid', {
      login_status: 'authenticated',
      user_type: 'buyer',
    });
    expect(transport.send).toHaveBeenCalledWith('view_item', { items: [], login_status: 'authenticated' });
  });

  it('marks sellers with user_type seller', () => {
    const { facade, transport } = createFacade();

    facade.identify({ id: 'seller-uuid', isSeller: true });

    expect(transport.identify).toHaveBeenCalledWith('seller-uuid', {
      login_status: 'authenticated',
      user_type: 'seller',
    });
  });

  it('clears the user id and tags events anonymous for a guest or after sign-out', () => {
    const { facade, transport } = createFacade();

    facade.identify({ id: 'user-uuid', isSeller: false });
    facade.identify(null);
    facade.track('view_shop', { shop_username: 'kafsh' });

    expect(transport.identify).toHaveBeenLastCalledWith(null, {
      login_status: 'anonymous',
      user_type: 'guest',
    });
    expect(transport.send).toHaveBeenCalledWith('view_shop', {
      shop_username: 'kafsh',
      login_status: 'anonymous',
    });
  });
});

describe('googleAnalyticsTransport', () => {
  const mutableEnv = env as { NEXT_PUBLIC_GA_ID: string };

  afterEach(() => {
    mutableEnv.NEXT_PUBLIC_GA_ID = '';
    jest.mocked(sendGAEvent).mockClear();
  });

  it('sends the event through sendGAEvent when GA is configured', () => {
    mutableEnv.NEXT_PUBLIC_GA_ID = 'G-TEST';

    googleAnalyticsTransport.send('sign_up', { method: 'phone_otp' });

    expect(sendGAEvent).toHaveBeenCalledWith('event', 'sign_up', { method: 'phone_otp' });
  });

  it('sets user_id and user properties when GA is configured', () => {
    mutableEnv.NEXT_PUBLIC_GA_ID = 'G-TEST';

    googleAnalyticsTransport.identify('user-uuid', { login_status: 'authenticated', user_type: 'buyer' });

    expect(sendGAEvent).toHaveBeenCalledWith('set', { user_id: 'user-uuid' });
    expect(sendGAEvent).toHaveBeenCalledWith('set', 'user_properties', {
      login_status: 'authenticated',
      user_type: 'buyer',
    });
  });

  it('does nothing when GA is not configured', () => {
    googleAnalyticsTransport.send('sign_up', { method: 'phone_otp' });
    googleAnalyticsTransport.identify(null, { login_status: 'anonymous', user_type: 'guest' });

    expect(sendGAEvent).not.toHaveBeenCalled();
  });
});
