import PhoneInput, { PhoneInputProps } from "../components/PhoneInput";
import userEvent from '@testing-library/user-event';

import { render } from '@testing-library/react'
import '@testing-library/jest-dom'

const INPUT_PLACEHOLDER = "09035703067";
const PHONE_NUMBER_ERROR_MESSAGE = "شماره تماس باید 11 رقم باشد.";

const initInput = (props: PhoneInputProps) => {
    return render(<PhoneInput {...props} />)
};

describe("Phone Input render", () => {
    it(`should render the input with place holder:${INPUT_PLACEHOLDER}`, () => {
        const { queryByPlaceholderText, getByText } = initInput({ placeholder: INPUT_PLACEHOLDER });

        expect(queryByPlaceholderText(INPUT_PLACEHOLDER)).toBeInTheDocument();

        expect(getByText("شماره همراه")).toBeInTheDocument();
    })
})

describe("Phone validation message render", () => {
    it('should render the error message', () => {
        const { getByRole, queryByRole, queryByText, rerender } = initInput({ isError: true, error: PHONE_NUMBER_ERROR_MESSAGE });

        expect(getByRole('alert')).toBeInTheDocument();
        expect(queryByText(PHONE_NUMBER_ERROR_MESSAGE)).toBeInTheDocument();

        rerender(<PhoneInput isError={false} />);

        expect(queryByRole('alert')).not.toBeInTheDocument();
        expect(queryByText(PHONE_NUMBER_ERROR_MESSAGE)).not.toBeInTheDocument();
    });
})

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
})