import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import PhoneInput, { PhoneInputProps } from "../components/PhoneInput";
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';

const INPUT_PLACEHOLDER = "09035703067";
const PHONE_NUMBER_ERROR_MESSAGE = "شماره تماس باید 11 رقم باشد.";

const initInput = (props: PhoneInputProps) => {
    return render(<PhoneInput {...props} />);
};

describe("Phone Input render", () => {
    it(`should render the input with place holder:${INPUT_PLACEHOLDER}`, () => {
        const { queryByPlaceholderText, getByText } = initInput({ placeholder: INPUT_PLACEHOLDER });

        expect(queryByPlaceholderText(INPUT_PLACEHOLDER)).toBeInTheDocument();
        expect(getByText("شماره همراه")).toBeInTheDocument();
    });

    it("should have correct input attributes for numeric phone entry", () => {
        const { getByRole } = initInput({});
        const input = getByRole('textbox');

        expect(input).toHaveAttribute('type', 'tel');
        expect(input).toHaveAttribute('inputmode', 'numeric');
        expect(input).toHaveAttribute('pattern', '[0-9]*');
        expect(input).toHaveAttribute('aria-invalid', 'false');
    });
});

describe("Phone validation message render", () => {
    it('should render the error message when isError is true', () => {
        const { getByRole, queryByRole, queryByText, rerender } = initInput({
            isError: true,
            error: PHONE_NUMBER_ERROR_MESSAGE,
        });

        expect(getByRole('alert')).toBeInTheDocument();
        expect(queryByText(PHONE_NUMBER_ERROR_MESSAGE)).toBeInTheDocument();
        expect(getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');

        rerender(<PhoneInput isError={false} />);

        expect(queryByRole('alert')).not.toBeInTheDocument();
        expect(queryByText(PHONE_NUMBER_ERROR_MESSAGE)).not.toBeInTheDocument();
        expect(getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
    });

    it('should automatically set error state when only error string is provided', () => {
        const { getByRole, getByText } = initInput({
            error: PHONE_NUMBER_ERROR_MESSAGE,
        });

        expect(getByRole('alert')).toBeInTheDocument();
        expect(getByText(PHONE_NUMBER_ERROR_MESSAGE)).toBeInTheDocument();
        expect(getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });
});

describe("Input Phone typing", () => {
    it("should type phone number and delete it correctly", async () => {
        const user = userEvent.setup();

        const { getByRole } = initInput({});
        const inputElement = getByRole('textbox');

        await user.type(inputElement, INPUT_PLACEHOLDER);
        expect(inputElement).toHaveValue(INPUT_PLACEHOLDER);

        await user.clear(inputElement);
        expect(inputElement).toHaveValue("");
    });
});

describe("PhoneInput with React Hook Form", () => {
    it("should register field and display error from form context", () => {
        function FormWrapper({ error }: { error?: string }) {
            const methods = useForm({
                defaultValues: { phoneNumber: "" },
            });

            useEffect(() => {
                if (error) {
                    methods.setError("phoneNumber", { message: error });
                }
            }, [error, methods]);

            return (
                <FormProvider {...methods}>
                    <PhoneInput name="phoneNumber" />
                </FormProvider>
            );
        }

        const { getByText, getByRole } = render(
            <FormWrapper error={PHONE_NUMBER_ERROR_MESSAGE} />
        );

        expect(getByRole('alert')).toBeInTheDocument();
        expect(getByText(PHONE_NUMBER_ERROR_MESSAGE)).toBeInTheDocument();
        expect(getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });
});

describe("PhoneInput Props & Ref", () => {
    it("should support disabled state", () => {
        const { getByRole } = initInput({ disabled: true });
        expect(getByRole('textbox')).toBeDisabled();
    });

    it("should forward ref correctly", () => {
        const ref = React.createRef<HTMLInputElement>();
        initInput({ ref });
        expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
});