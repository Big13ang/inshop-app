import React from 'react';
import { render, screen, userEvent, expect } from '@/lib/test-utils';
import OtpInputGroup from '../components/OtpInputGroup';
import { useOtp } from '../hooks/useOtp';
import { OTP_LENGTH } from '../hooks/otpLogic';

function OtpGroupHarness({ onComplete }: { onComplete?: (code: string) => void }) {
  const completeCallback = onComplete ?? jest.fn();
  const {
    slots,
    inputRefs,
    handleChange,
    handleKeyDown,
    handlePaste,
    reset,
  } = useOtp(completeCallback);

  return (
    <div>
      <OtpInputGroup
        slots={slots}
        inputRefs={inputRefs}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />
      <button type="button" onClick={reset}>
        Reset
      </button>
    </div>
  );
}

const setup = (onComplete = jest.fn()) => {
  const user = userEvent.setup();
  const renderResult = render(<OtpGroupHarness onComplete={onComplete} />);
  const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];

  return {
    user,
    onComplete,
    inputs,
    ...renderResult,
  };
};

describe('OtpInputGroup - Rendering & Attributes', () => {
  it('should render exactly 4 input elements with numeric inputmode and maxLength 1', () => {
    const { inputs } = setup();

    expect(inputs).toHaveLength(OTP_LENGTH);

    inputs.forEach((input, index) => {
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('inputmode', 'numeric');
      expect(input).toHaveAttribute('maxLength', '1');
      expect(input).toHaveValue('');
      expect(input).toHaveAttribute('id', `otp-input-${index}`);
    });
  });

  it('should have one-time-code autocomplete on the first input and off on others', () => {
    const { inputs } = setup();

    expect(inputs[0]).toHaveAttribute('autoComplete', 'one-time-code');
    expect(inputs[1]).toHaveAttribute('autoComplete', 'off');
    expect(inputs[2]).toHaveAttribute('autoComplete', 'off');
    expect(inputs[3]).toHaveAttribute('autoComplete', 'off');
  });

  it('should auto-focus only the first input on initial mount', () => {
    const { inputs } = setup();

    expect(inputs[0]).toHaveFocus();
    expect(inputs[1]).not.toHaveFocus();
    expect(inputs[2]).not.toHaveFocus();
    expect(inputs[3]).not.toHaveFocus();
  });
});

describe('OtpInputGroup - Typing & Behavior', () => {
  it('should accept a single digit in each slot and auto-advance focus to the next input', async () => {
    const { user, inputs, onComplete } = setup();

    await user.type(inputs[0], '5');
    expect(inputs[0]).toHaveValue('5');
    expect(inputs[1]).toHaveFocus();

    await user.type(inputs[1], '8');
    expect(inputs[1]).toHaveValue('8');
    expect(inputs[2]).toHaveFocus();

    await user.type(inputs[2], '2');
    expect(inputs[2]).toHaveValue('2');
    expect(inputs[3]).toHaveFocus();

    await user.type(inputs[3], '9');
    expect(inputs[3]).toHaveValue('9');

    expect(onComplete).toHaveBeenCalledWith('5829');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('should select the input text when focused', async () => {
    const { user, inputs } = setup();

    const selectSpy = jest.spyOn(inputs[1], 'select');
    await user.click(inputs[1]);

    expect(selectSpy).toHaveBeenCalled();
    selectSpy.mockRestore();
  });

  it('should ignore non-numeric character entries and maintain current value', async () => {
    const { user, inputs, onComplete } = setup();

    await user.type(inputs[0], 'a');
    expect(inputs[0]).toHaveValue('');
    expect(inputs[0]).toHaveFocus();

    await user.type(inputs[0], '!');
    expect(inputs[0]).toHaveValue('');
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('should move focus to previous input when pressing Backspace in an empty slot', async () => {
    const { user, inputs } = setup();

    await user.type(inputs[0], '4');
    expect(inputs[1]).toHaveFocus();

    await user.keyboard('{Backspace}');
    expect(inputs[0]).toHaveFocus();
  });

  it('should fill all 4 slots and trigger onComplete when pasting a 4-digit numeric code', async () => {
    const { user, inputs, onComplete } = setup();

    inputs[0].focus();
    await user.paste('1357');

    expect(inputs[0]).toHaveValue('1');
    expect(inputs[1]).toHaveValue('3');
    expect(inputs[2]).toHaveValue('5');
    expect(inputs[3]).toHaveValue('7');
    expect(onComplete).toHaveBeenCalledWith('1357');
  });

  it('should filter out non-numeric characters from pasted text', async () => {
    const { user, inputs, onComplete } = setup();

    inputs[0].focus();
    await user.paste('4-a-9-b-2-c-1');

    expect(inputs[0]).toHaveValue('4');
    expect(inputs[1]).toHaveValue('9');
    expect(inputs[2]).toHaveValue('2');
    expect(inputs[3]).toHaveValue('1');
    expect(onComplete).toHaveBeenCalledWith('4921');
  });

  it('should clear all inputs and focus the first slot when reset is invoked', async () => {
    const { user, inputs } = setup();

    await user.type(inputs[0], '1');
    await user.type(inputs[1], '2');

    const resetButton = screen.getByRole('button', { name: /reset/i });
    await user.click(resetButton);

    inputs.forEach((input) => {
      expect(input).toHaveValue('');
    });
    expect(inputs[0]).toHaveFocus();
  });

  it('should handle multi-character direct input (autofill) in a slot', async () => {
    const { user, inputs, onComplete } = setup();

    await user.type(inputs[0], '9876');

    expect(inputs[0]).toHaveValue('9');
    expect(inputs[1]).toHaveValue('8');
    expect(inputs[2]).toHaveValue('7');
    expect(inputs[3]).toHaveValue('6');
    expect(onComplete).toHaveBeenCalledWith('9876');
  });
});
