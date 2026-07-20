import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BackButton from '../BackButton';

const mockGoBackSafely = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace }),
}));

jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  goBackSafely: (router: unknown) => mockGoBackSafely(router),
}));

afterEach(() => {
  mockGoBackSafely.mockClear();
  mockBack.mockClear();
  mockReplace.mockClear();
});

describe('BackButton', () => {
  it('calls goBackSafely with router when no custom onClick is provided', async () => {
    const user = userEvent.setup();

    render(<BackButton />);

    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(mockGoBackSafely).toHaveBeenCalled();
  });

  it('uses the custom onClick when provided', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<BackButton onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(onClick).toHaveBeenCalled();
    expect(mockGoBackSafely).not.toHaveBeenCalled();
  });
});
