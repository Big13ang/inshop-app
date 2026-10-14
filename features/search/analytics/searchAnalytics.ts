import { analytics } from '@/lib/analytics/analytics';

export const searchAnalytics = {
  viewResults(searchTerm: string, resultsCount: number) {
    analytics.track('view_search_results', {
      search_term: searchTerm,
      results_count: resultsCount,
    });
  },
};
