import { renderHook, act } from '@testing-library/react';
import { useOtp } from '../useOtp';
import { OTP_LENGTH } from '../otpLogic';

describe('useOtp', () => {
  let mockOnComplete: jest.Mock;
  let mockInputs: Array<{ focus: jest.Mock }>;

  beforeEach(() => {
    mockOnComplete = jest.fn();
    mockInputs = Array.from({ length: OTP_LENGTH }, () => ({
      focus: jest.fn(),
    }));
  });

  const setupHook = () => {
    const hook = renderHook(() => useOtp(mockOnComplete));
    hook.result.current.inputRefs.current = mockInputs as unknown as HTMLInputElement[];
    return hook;
  };

  it('initializes with empty slots and refs', () => {
    const { result } = setupHook();
    expect(result.current.slots).toEqual(Array(OTP_LENGTH).fill(''));
    expect(result.current.inputRefs.current).toHaveLength(OTP_LENGTH);
  });

  it('handles single digit entry and moves focus forward', () => {
    const { result } = setupHook();

    act(() => {
      result.current.handleChange(0, '5');
    });

    expect(result.current.slots[0]).toBe('5');
    expect(mockInputs[1].focus).toHaveBeenCalled();
  });

  it('ignores non-digit inputs', () => {
    const { result } = setupHook();

    act(() => {
      result.current.handleChange(0, 'a');
    });

    expect(result.current.slots[0]).toBe('');
    expect(mockInputs[1].focus).not.toHaveBeenCalled();
  });

  it('triggers onComplete when all slots are filled', () => {
    const { result } = setupHook();

    // Fill first OTP_LENGTH - 1 slots (0, 1, 2)
    act(() => {
      for (let i = 0; i < OTP_LENGTH - 1; i++) {
        result.current.handleChange(i, String(i + 1));
      }
    });

    expect(mockOnComplete).not.toHaveBeenCalled();

    // Fill the last slot (3)
    act(() => {
      result.current.handleChange(OTP_LENGTH - 1, '9');
    });

    expect(result.current.slots).toEqual(['1', '2', '3', '9']);
    expect(mockOnComplete).toHaveBeenCalledWith('1239');
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('navigates backward on Backspace when slot is empty', () => {
    const { result } = setupHook();

    act(() => {
      result.current.handleChange(0, '1');
      result.current.handleChange(1, '2');
    });

    // Backspace on non-empty slot does not move focus backward automatically
    const eNonEmpty = { key: 'Backspace' } as unknown as React.KeyboardEvent<HTMLInputElement>;
    act(() => {
      result.current.handleKeyDown(1, eNonEmpty);
    });
    expect(mockInputs[0].focus).not.toHaveBeenCalled();

    // Backspace on empty slot moves focus backward
    const eEmpty = { key: 'Backspace' } as unknown as React.KeyboardEvent<HTMLInputElement>;
    act(() => {
      result.current.handleKeyDown(2, eEmpty);
    });
    expect(mockInputs[1].focus).toHaveBeenCalled();
  });

  it('handles paste events to fill slots and submit', () => {
    const { result } = setupHook();

    const mockEvent = {
      preventDefault: jest.fn(),
      clipboardData: {
        getData: () => '1234',
      },
    } as unknown as React.ClipboardEvent;

    act(() => {
      result.current.handlePaste(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(result.current.slots).toEqual(['1', '2', '3', '4']);
    expect(mockInputs[OTP_LENGTH - 1].focus).toHaveBeenCalled();
    expect(mockOnComplete).toHaveBeenCalledWith('1234');
  });

  it('resets all slots and moves focus to start', () => {
    const { result } = setupHook();

    act(() => {
      result.current.handleChange(0, '9');
    });

    expect(result.current.slots[0]).toBe('9');

    act(() => {
      result.current.reset();
    });

    expect(result.current.slots).toEqual(Array(OTP_LENGTH).fill(''));
    expect(mockInputs[0].focus).toHaveBeenCalled();
  });

  it('prevents duplicate verification requests when completed multiple times rapidly', () => {
    const { result } = setupHook();

    // Trigger complete via handleChange
    act(() => {
      for (let i = 0; i < OTP_LENGTH - 1; i++) {
        result.current.handleChange(i, String(i + 1));
      }
      result.current.handleChange(OTP_LENGTH - 1, '6');
    });

    // Trigger complete again with the same value (simulate rapid double event or auto-submit race)
    act(() => {
      result.current.handleChange(OTP_LENGTH - 1, '6');
    });

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('allows verification after modifying a slot back and completing again', () => {
    const { result } = setupHook();

    // Submit first time
    act(() => {
      for (let i = 0; i < OTP_LENGTH - 1; i++) {
        result.current.handleChange(i, String(i + 1));
      }
      result.current.handleChange(OTP_LENGTH - 1, '6');
    });
    expect(mockOnComplete).toHaveBeenCalledTimes(1);

    // Modify a slot (backspace to clear)
    act(() => {
      // Clear last slot
      result.current.handleChange(OTP_LENGTH - 1, '');
    });

    // Complete again with same digit
    act(() => {
      result.current.handleChange(OTP_LENGTH - 1, '6');
    });

    expect(mockOnComplete).toHaveBeenCalledTimes(2);
    expect(mockOnComplete).toHaveBeenLastCalledWith('1236');
  });
});
