import { waitFor, expect } from '@/lib/test-utils';
import { TEXTS } from '../constants';
import { VALID_PHONES, INVALID_PHONES } from './fixtures/phones';
import { createLoginDriver } from '@/features/auth/testing/authDrivers';

describe('Login Component - Initial State', () => {
    it('renders phone input with associated label and disabled submit button', () => {
        const page = createLoginDriver();

        expect(page.phoneLabel()).toBeInTheDocument();
        expect(page.phoneInput()).toHaveAttribute('aria-invalid', 'false');
        expect(page.submitButton()).toBeDisabled();
    });

    it('does not display validation error before user interaction', () => {
        const page = createLoginDriver();

        expect(page.queryAlert()).not.toBeInTheDocument();
    });
});

describe('Login Component - Validation & Error Recovery', () => {
    it('shows error feedback and sets aria-invalid when invalid phone is entered', async () => {
        const page = createLoginDriver();

        await page.fillPhone(INVALID_PHONES.tooShort);

        await waitFor(() => {
            expect(page.alert()).toBeInTheDocument();
            expect(page.alert()).toHaveTextContent(TEXTS.errorInvalidPhone);
            expect(page.phoneInput()).toHaveAttribute('aria-invalid', 'true');
        });
    });

    it('clears error feedback and resets aria-invalid when user corrects to a valid phone', async () => {
        const page = createLoginDriver();

        await page.fillPhone(INVALID_PHONES.tooShort);
        await waitFor(() => expect(page.queryAlert()).toBeInTheDocument());

        await page.clearPhone();
        await page.fillPhone(VALID_PHONES.standard);

        await waitFor(() => {
            expect(page.queryAlert()).not.toBeInTheDocument();
            expect(page.phoneInput()).toHaveAttribute('aria-invalid', 'false');
        });
    });
});

describe('Login Component - Submit Button State', () => {
    it('enables submit button on valid phone and re-disables when cleared', async () => {
        const page = createLoginDriver();

        await page.fillPhone(VALID_PHONES.standard);
        await waitFor(() => expect(page.submitButton()).not.toBeDisabled());

        await page.clearPhone();
        await waitFor(() => expect(page.submitButton()).toBeDisabled());
    });
});

describe('Login Component - Submission Flow', () => {
    it('calls onSubmit with valid phone number on button click', async () => {
        const page = createLoginDriver();

        await page.fillAndSubmit(VALID_PHONES.standard);

        await waitFor(() => {
            expect(page.onSubmit).toHaveBeenCalledTimes(1);
            expect(page.onSubmit).toHaveBeenCalledWith({ phone: VALID_PHONES.standard });
        });
    });

    it('submits the form when Enter key is pressed in phone input with valid data', async () => {
        const page = createLoginDriver();

        await page.fillPhone(VALID_PHONES.standard);
        await waitFor(() => expect(page.submitButton()).not.toBeDisabled());

        await page.submitPhone();

        await waitFor(() => {
            expect(page.onSubmit).toHaveBeenCalledTimes(1);
            expect(page.onSubmit).toHaveBeenCalledWith({ phone: VALID_PHONES.standard });
        });
    });

    it('displays loading state and disables submit button during async submission', async () => {
        let resolveSubmit!: () => void;
        const asyncSubmit = jest.fn().mockImplementation(
            () =>
                new Promise<void>((resolve) => {
                    resolveSubmit = resolve;
                })
        );

        const page = createLoginDriver({ onSubmit: asyncSubmit });

        await page.fillPhone(VALID_PHONES.standard);
        await waitFor(() => expect(page.submitButton()).not.toBeDisabled());

        await page.clickSubmit();

        // In-flight state: button shows loading text & is disabled
        await waitFor(() => {
            expect(page.querySubmittingButton()).toBeInTheDocument();
            expect(page.querySubmittingButton()).toBeDisabled();
            expect(page.querySubmitButton()).not.toBeInTheDocument();
        });

        resolveSubmit();

        // Completion state: normal button restored
        await waitFor(() => {
            expect(page.querySubmitButton()).toBeInTheDocument();
            expect(page.querySubmittingButton()).not.toBeInTheDocument();
        });
    });
});