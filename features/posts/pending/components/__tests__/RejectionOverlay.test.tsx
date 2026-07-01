/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RejectionOverlay from '../RejectionOverlay';
import { text } from '../../constants';

describe('RejectionOverlay', () => {
  it('renders the given rejection reason', () => {
    render(<RejectionOverlay rejectionReason="دلیل رد شدن" onDismiss={jest.fn()} />);
    expect(screen.getByText('دلیل رد شدن')).toBeInTheDocument();
  });

  it('falls back to the default reason when none is given', () => {
    render(<RejectionOverlay onDismiss={jest.fn()} />);
    expect(screen.getByText(text.rejectionDefaultReason)).toBeInTheDocument();
  });

  it('calls onDismiss when the dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = jest.fn();
    render(<RejectionOverlay onDismiss={onDismiss} />);

    await user.click(screen.getByText(text.rejectionActionText));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('toggles the policy details list', async () => {
    const user = userEvent.setup();
    render(<RejectionOverlay onDismiss={jest.fn()} />);

    expect(screen.queryByText(text.rejectionTips[0])).not.toBeInTheDocument();

    await user.click(screen.getByText(text.rejectionShowDetails));

    expect(screen.getByText(text.rejectionTips[0])).toBeInTheDocument();
  });
});
