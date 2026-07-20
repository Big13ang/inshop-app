import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BackButton from '../BackButton';

const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

afterEach(() => {
  mockReplace.mockClear();
});

describe('BackButton', () => {
  it('replaces with home when no custom onClick is provided', async () => {
    const user = userEvent.setup();

    render(<BackButton />);

    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('uses the custom onClick when provided', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<BackButton onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(onClick).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
