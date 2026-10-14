import { analytics } from '@/lib/analytics/analytics';
import { searchAnalytics } from '../searchAnalytics';

describe('searchAnalytics', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('tracks view_search_results, including zero results', () => {
    const track = jest.spyOn(analytics, 'track').mockImplementation(() => {});

    searchAnalytics.viewResults('کفش', 0);

    expect(track).toHaveBeenCalledWith('view_search_results', { search_term: 'کفش', results_count: 0 });
  });
});
