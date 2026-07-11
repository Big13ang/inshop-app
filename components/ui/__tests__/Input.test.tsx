import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input Component', () => {
  it('renders standard input correctly', () => {
    render(<Input placeholder="User name" />);
    const input = screen.getByPlaceholderText('User name');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('forwards the ref to the underlying input element', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="Test Ref" />);
    const input = screen.getByPlaceholderText('Test Ref');
    expect(ref.current).toBe(input);
  });

  it('renders with default styling classes', () => {
    render(<Input placeholder="Styling" />);
    const input = screen.getByPlaceholderText('Styling');
    expect(input).toHaveClass('border-zinc-200/90');
    expect(input).toHaveClass('h-12');
  });

  it('applies error variant styles when isError is true', () => {
    render(<Input isError placeholder="Error Styling" />);
    const input = screen.getByPlaceholderText('Error Styling');
    expect(input).toHaveClass('border-red-400');
  });

  it('applies lg inputSize style classes', () => {
    render(<Input inputSize="lg" placeholder="Large Styling" />);
    const input = screen.getByPlaceholderText('Large Styling');
    expect(input).toHaveClass('h-14');
  });

  it('applies sm inputSize style classes', () => {
    render(<Input inputSize="sm" placeholder="Small Styling" />);
    const input = screen.getByPlaceholderText('Small Styling');
    expect(input).toHaveClass('h-10');
  });

  it('appends custom classNames', () => {
    render(<Input className="custom-class-123" placeholder="Custom Class" />);
    const input = screen.getByPlaceholderText('Custom Class');
    expect(input).toHaveClass('custom-class-123');
  });

  it('passes generic HTML attributes to the input element', () => {
    render(<Input type="email" disabled maxLength={10} placeholder="Attributes" />);
    const input = screen.getByPlaceholderText('Attributes');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('maxLength', '10');
  });

  describe('Value Normalization', () => {
    it('normalizes typed characters when normalize prop is provided', async () => {
      const user = userEvent.setup();
      const normalizeMock = jest.fn((val: string) => val.toUpperCase());
      const onChangeMock = jest.fn();

      render(<Input normalize={normalizeMock} onChange={onChangeMock} placeholder="Normalizing" />);
      const input = screen.getByPlaceholderText('Normalizing');

      await user.type(input, 'abc');

      // The mock should have been called during input typing
      expect(normalizeMock).toHaveBeenCalled();
      expect(input).toHaveValue('ABC');

      // The onChange callback should have received the normalized value in the event
      expect(onChangeMock).toHaveBeenCalled();
      const lastEvent = onChangeMock.mock.calls[onChangeMock.mock.calls.length - 1][0];
      expect(lastEvent.target.value).toBe('ABC');
    });

    it('does not modify typed characters when normalize prop is omitted', async () => {
      const user = userEvent.setup();
      const onChangeMock = jest.fn();

      render(<Input onChange={onChangeMock} placeholder="No Normalizing" />);
      const input = screen.getByPlaceholderText('No Normalizing');

      await user.type(input, 'abc');
      expect(input).toHaveValue('abc');
      expect(onChangeMock).toHaveBeenCalled();
      const lastEvent = onChangeMock.mock.calls[onChangeMock.mock.calls.length - 1][0];
      expect(lastEvent.target.value).toBe('abc');
    });
  });
});
