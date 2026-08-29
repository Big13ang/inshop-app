import React from 'react';
import { render, userEvent, expect } from '@/lib/test-utils';
import SubmitButton, { SubmitButtonProps } from '../components/SubmitButton';

const initButton = (props: Partial<SubmitButtonProps> = {}, children: React.ReactNode = 'ادامه') => {
    return render(<SubmitButton {...props}>{children}</SubmitButton>);
};

describe('SubmitButton - Rendering & Content', () => {
    it('should render button with children text and submit type', () => {
        const { getByRole } = initButton({}, 'ورود به حساب');
        const button = getByRole('button', { name: /ورود به حساب/i });

        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('type', 'submit');
        expect(button).not.toBeDisabled();
    });

    it('should change button text when isSubmitting is true and submittingText is provided', () => {
        const { getByRole, queryByText, rerender } = initButton({
            isSubmitting: false,
            submittingText: 'در حال ارسال...',
        }, 'ارسال کد');

        expect(getByRole('button', { name: /ارسال کد/i })).toBeInTheDocument();

        rerender(
            <SubmitButton isSubmitting={true} submittingText="در حال ارسال...">
                ارسال کد
            </SubmitButton>
        );

        expect(getByRole('button', { name: /در حال ارسال\.\.\./i })).toBeInTheDocument();
        expect(queryByText('ارسال کد')).not.toBeInTheDocument();
    });

    it('should keep children text when isSubmitting is true but submittingText is omitted', () => {
        const { getByRole } = initButton({ isSubmitting: true }, 'تأیید و ادامه');
        expect(getByRole('button', { name: /تأیید و ادامه/i })).toBeInTheDocument();
    });
});

describe('SubmitButton - State & User Interaction', () => {
    it('should trigger onClick callback when clicked', async () => {
        const user = userEvent.setup();
        const handleClick = jest.fn();

        const { getByRole } = initButton({ onClick: handleClick }, 'ادامه');
        const button = getByRole('button', { name: /ادامه/i });

        await user.click(button);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled and not trigger onClick when isSubmitting is true', async () => {
        const user = userEvent.setup();
        const handleClick = jest.fn();

        const { getByRole } = initButton({
            isSubmitting: true,
            onClick: handleClick,
        }, 'ادامه');

        const button = getByRole('button', { name: /ادامه/i });
        expect(button).toBeDisabled();

        await user.click(button);
        expect(handleClick).not.toHaveBeenCalled();
    });

    it('should be disabled when disabled prop is explicitly passed', async () => {
        const user = userEvent.setup();
        const handleClick = jest.fn();

        const { getByRole } = initButton({
            disabled: true,
            onClick: handleClick,
        }, 'ادامه');

        const button = getByRole('button', { name: /ادامه/i });
        expect(button).toBeDisabled();

        await user.click(button);
        expect(handleClick).not.toHaveBeenCalled();
    });
});

describe('SubmitButton - Props & Ref', () => {
    it('should forward ref correctly to underlying button element', () => {
        const ref = React.createRef<HTMLButtonElement>();
        render(<SubmitButton ref={ref}>تست</SubmitButton>);

        expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('should apply custom className', () => {
        const { getByRole } = initButton({ className: 'custom-class' });
        expect(getByRole('button')).toHaveClass('custom-class');
    });
});
