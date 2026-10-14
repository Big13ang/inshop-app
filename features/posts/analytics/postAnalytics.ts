import { analytics } from '@/lib/analytics/analytics';

export type PostListName = 'home_feed' | 'search_results' | 'shop_grid' | 'viewed_posts';

export interface AnalyticsPostItem {
  postId: string;
  shopUsername?: string;
  shopName?: string;
}

interface GAItem {
  item_id: string;
  shop_username?: string;
  shop_name?: string;
  item_list_id?: PostListName;
  item_list_name?: PostListName;
  index?: number;
}

const IMPRESSION_FLUSH_DELAY_MS = 1000;

function toGAItem(item: AnalyticsPostItem, listName?: PostListName, index?: number): GAItem {
  return {
    item_id: item.postId,
    shop_username: item.shopUsername,
    shop_name: item.shopName,
    item_list_id: listName,
    item_list_name: listName,
    index,
  };
}

/** Product (post) events. Card impressions are batched into one `view_item_list` per list. */
export class PostAnalytics {
  private readonly flushDelayMs: number;
  private pendingImpressions = new Map<PostListName, GAItem[]>();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(flushDelayMs = IMPRESSION_FLUSH_DELAY_MS) {
    this.flushDelayMs = flushDelayMs;
  }

  itemImpression(listName: PostListName, item: AnalyticsPostItem, index: number) {
    const queue = this.pendingImpressions.get(listName) ?? [];
    queue.push(toGAItem(item, listName, index));
    this.pendingImpressions.set(listName, queue);
    this.scheduleFlush();
  }

  flushImpressions() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    for (const [listName, items] of this.pendingImpressions) {
      analytics.track('view_item_list', {
        item_list_id: listName,
        item_list_name: listName,
        items,
      });
    }
    this.pendingImpressions.clear();
  }

  selectItem(listName: PostListName, item: AnalyticsPostItem, index: number) {
    // Impressions must reach GA before the click that follows them.
    this.flushImpressions();
    analytics.track('select_item', {
      item_list_id: listName,
      item_list_name: listName,
      items: [toGAItem(item, listName, index)],
    });
  }

  viewItem(item: AnalyticsPostItem) {
    analytics.track('view_item', { items: [toGAItem(item)] });
  }

  submitProduct(postId: string) {
    analytics.track('submit_product', { item_id: postId });
  }

  private scheduleFlush() {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => this.flushImpressions(), this.flushDelayMs);
  }
}

export const postAnalytics = new PostAnalytics();
