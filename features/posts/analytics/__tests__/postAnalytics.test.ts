import { analytics } from '@/lib/analytics/analytics';
import { PostAnalytics } from '../postAnalytics';

const item = { postId: 'post-1', shopUsername: 'kafsh', shopName: 'کفش‌سرا' };

describe('PostAnalytics', () => {
  let track: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    track = jest.spyOn(analytics, 'track').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('batches visible cards into one view_item_list per list after the flush delay', () => {
    const posts = new PostAnalytics(1000);

    posts.itemImpression('home_feed', item, 0);
    posts.itemImpression('home_feed', { postId: 'post-2' }, 1);
    posts.itemImpression('search_results', { postId: 'post-3' }, 0);

    expect(track).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);

    expect(track).toHaveBeenCalledTimes(2);
    expect(track).toHaveBeenCalledWith('view_item_list', {
      item_list_id: 'home_feed',
      item_list_name: 'home_feed',
      items: [
        {
          item_id: 'post-1',
          shop_username: 'kafsh',
          shop_name: 'کفش‌سرا',
          item_list_id: 'home_feed',
          item_list_name: 'home_feed',
          index: 0,
        },
        expect.objectContaining({ item_id: 'post-2', index: 1 }),
      ],
    });
    expect(track).toHaveBeenCalledWith(
      'view_item_list',
      expect.objectContaining({
        item_list_name: 'search_results',
        items: [expect.objectContaining({ item_id: 'post-3' })],
      })
    );
  });

  it('sends cards seen later while scrolling in a new batch', () => {
    const posts = new PostAnalytics(1000);

    posts.itemImpression('home_feed', item, 0);
    jest.advanceTimersByTime(1000);
    posts.itemImpression('home_feed', { postId: 'post-7' }, 6);
    jest.advanceTimersByTime(1000);

    expect(track).toHaveBeenCalledTimes(2);
    expect(track).toHaveBeenLastCalledWith(
      'view_item_list',
      expect.objectContaining({ items: [expect.objectContaining({ item_id: 'post-7', index: 6 })] })
    );
  });

  it('flushes pending impressions before select_item', () => {
    const posts = new PostAnalytics(1000);

    posts.itemImpression('shop_grid', item, 2);
    posts.selectItem('shop_grid', item, 2);

    expect(track.mock.calls.map(([name]) => name)).toEqual(['view_item_list', 'select_item']);
    expect(track).toHaveBeenLastCalledWith('select_item', {
      item_list_id: 'shop_grid',
      item_list_name: 'shop_grid',
      items: [expect.objectContaining({ item_id: 'post-1', index: 2 })],
    });

    jest.advanceTimersByTime(1000);
    expect(track).toHaveBeenCalledTimes(2);
  });

  it('tracks view_item and submit_product', () => {
    const posts = new PostAnalytics(1000);

    posts.viewItem(item);
    posts.submitProduct('post-9');

    expect(track.mock.calls).toEqual([
      ['view_item', {
        items: [expect.objectContaining({
          item_id: 'post-1',
          shop_username: 'kafsh',
          shop_name: 'کفش‌سرا',
        })],
      }],
      ['submit_product', { item_id: 'post-9' }],
    ]);
  });
});
