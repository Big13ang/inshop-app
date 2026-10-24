import { render, screen } from '@testing-library/react';
import StatusOverlay from '../StatusOverlay';
import type { MediaItem, MediaStatus } from '../../types';

const makeItem = (status: MediaItem['status'], uploadProgress = 0): MediaItem => ({
  id: 'm1',
  serverMediaId: null,
  kind: 'image',
  status,
  uploadProgress,
  order: 1,
  previewUrl: null,
  file: new File(['x'], 'a.jpg', { type: 'image/jpeg' }),
  isValid: true,
});

describe('StatusOverlay', () => {
  it('shows the optimizing label with a spinner', () => {
    render(<StatusOverlay item={makeItem('optimizing')} />);
    expect(screen.getByText('بهینه‌سازی…')).toBeInTheDocument();
    expect(screen.getByTestId('status-spinner')).toBeInTheDocument();
  });

  it('renders nothing once uploaded', () => {
    const { container } = render(<StatusOverlay item={makeItem('uploaded')} />);
    expect(container).toBeEmptyDOMElement();
  });

  const EXPECTED: Record<MediaStatus, { label?: string; testId?: string; empty?: boolean }> = {
    queued: {},
    pending: {},
    optimizing: { label: 'بهینه‌سازی…', testId: 'status-spinner' },
    uploading: {},
    uploaded: { empty: true },
    failed: { label: 'خطا' },
  };

  it.each(Object.keys(EXPECTED) as MediaStatus[])('renders the expected overlay for %s', (status) => {
    const expected = EXPECTED[status];
    const { container } = render(<StatusOverlay item={makeItem(status, 40)} />);

    if (expected.empty) {
      expect(container).toBeEmptyDOMElement();
      return;
    }
    expect(container).not.toBeEmptyDOMElement();
    if (expected.label) expect(screen.getByText(expected.label)).toBeInTheDocument();
    if (expected.testId) expect(screen.getByTestId(expected.testId)).toBeInTheDocument();
  });

  it('shows no progress ring or percentage while optimizing', () => {
    const { container } = render(<StatusOverlay item={makeItem('optimizing', 40)} />);
    expect(container.querySelector('circle')).toBeNull();
    expect(screen.queryByText(/٪/)).not.toBeInTheDocument();
  });

  it('shows the percentage and no optimizing label while uploading', () => {
    const { container } = render(<StatusOverlay item={makeItem('uploading', 40)} />);
    expect(screen.getByText('40٪')).toBeInTheDocument();
    expect(container.querySelector('circle')).not.toBeNull();
    expect(screen.queryByText('بهینه‌سازی…')).not.toBeInTheDocument();
  });

  it('shows the retry button when failed', () => {
    render(<StatusOverlay item={makeItem('failed')} />);
    expect(screen.getByRole('button', { name: 'تلاش دوباره' })).toBeInTheDocument();
  });
});
