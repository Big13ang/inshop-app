import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AddPostBody from '../AddPostBody';
import { useMediaStore } from '../../services/mediaStore';
import { text } from '../../constants';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('AddPostBody Component (Behavior)', () => {
  beforeEach(() => {
    useMediaStore.getState().reset();
  });

  it('renders loading skeleton when session is loading', () => {
    renderWithProviders(<AddPostBody isSessionLoading={true} />);

    expect(screen.queryByText(text.sellerPanelBadge)).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: text.captionLabel })).not.toBeInTheDocument();
  });

  it('renders SelectMediaPhaseView when phase is "select"', () => {
    useMediaStore.getState().setPhase('select');
    renderWithProviders(<AddPostBody isSessionLoading={false} />);

    expect(screen.getByText(text.sellerPanelBadge)).toBeInTheDocument();
    expect(screen.getAllByText('تصویری انتخاب نشده').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole('textbox', { name: text.captionLabel })).not.toBeInTheDocument();
  });

  it('renders PostDetailsPhaseView when phase is "details"', () => {
    useMediaStore.getState().setPhase('details');
    renderWithProviders(<AddPostBody isSessionLoading={false} />);

    expect(screen.getByRole('textbox', { name: text.captionLabel })).toBeInTheDocument();
    expect(screen.queryByText(text.sellerPanelBadge)).not.toBeInTheDocument();
  });
});
