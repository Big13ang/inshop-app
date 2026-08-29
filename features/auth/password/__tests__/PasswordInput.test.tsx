import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { AUTH_FORMS, AuthForm } from "../../constant";
import { render, userEvent, expect } from "@/lib/test-utils";
import PasswordInput from "../components/PasswordInput";

interface FormWrapperProps {
    children: React.ReactNode;
    defaultValues?: {
        password?: string;
        authForm?: AuthForm;
    };
    errors?: Record<string, { message: string }>;
}

function FormWrapper({ children, defaultValues, errors }: FormWrapperProps) {
    const methods = useForm({
        defaultValues: {
            password: '',
            authForm: AUTH_FORMS.SIGN_IN,
            ...defaultValues,
        },
    });

    useEffect(() => {
        if (errors) {
            Object.entries(errors).forEach(([field, error]) => {
                methods.setError(field as 'password' | 'authForm', error);
            });
        }
    }, [errors, methods]);

    return <FormProvider {...methods}>{children}</FormProvider>;
}

const setup = (options?: Omit<FormWrapperProps, 'children'>) => {
    const user = userEvent.setup();

    const renderResult = render(
        <FormWrapper {...options}>
            <PasswordInput />
        </FormWrapper>
    );

    return {
        user,
        ...renderResult,
    };
};

const PASSWORD_SAMPLE = "TangehArman1234";

describe("PasswordInput - Rendering", () => {
    it("should render password input with show/hide button and initial hidden type", () => {
        const { getByPlaceholderText, getByRole, getByText } = setup();

        const passwordInput = getByPlaceholderText("••••••••");
        const toggleButton = getByRole("button", { name: /نمایش رمز عبور/i });

        expect(passwordInput).toBeInTheDocument();
        expect(passwordInput).toHaveAttribute("type", "password");
        expect(toggleButton).toBeInTheDocument();
        expect(getByText("رمز عبور")).toBeInTheDocument();
    });

    it("should render 'رمز عبور جدید' label when in finalize steps", () => {
        const { getByText } = setup({
            defaultValues: { authForm: AUTH_FORMS.SIGN_UP_FINALIZE },
        });

        expect(getByText("رمز عبور جدید")).toBeInTheDocument();
    });
});

describe("PasswordInput - User Interaction", () => {
    it("should allow user to type and clear password value", async () => {
        const { getByPlaceholderText, user } = setup();

        const passwordInput = getByPlaceholderText("••••••••");

        await user.type(passwordInput, PASSWORD_SAMPLE);
        expect(passwordInput).toHaveValue(PASSWORD_SAMPLE);

        await user.clear(passwordInput);
        expect(passwordInput).toHaveValue("");
    });

    it("should initialize with default password value if provided", () => {
        const { getByPlaceholderText } = setup({
            defaultValues: { password: PASSWORD_SAMPLE },
        });

        const passwordInput = getByPlaceholderText("••••••••");
        expect(passwordInput).toHaveValue(PASSWORD_SAMPLE);
    });

    it("should toggle password visibility and update aria-label on click", async () => {
        const { getByPlaceholderText, getByRole, user } = setup();

        const passwordInput = getByPlaceholderText("••••••••");
        const toggleButton = getByRole("button", { name: "نمایش رمز عبور" });

        expect(passwordInput).toHaveAttribute("type", "password");

        // Toggle to show password
        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute("type", "text");
        expect(toggleButton).toHaveAttribute("aria-label", "مخفی کردن رمز عبور");

        // Toggle back to hide password
        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute("type", "password");
        expect(toggleButton).toHaveAttribute("aria-label", "نمایش رمز عبور");
    });
});

describe("PasswordInput - Error Handling", () => {
    it("should display error message when there is a password error and not in sign-in mode", () => {
        const errorMessage = "رمز عبور باید حداقل ۸ کاراکتر باشد";
        const { getByText } = setup({
            defaultValues: { authForm: AUTH_FORMS.SIGN_UP_FINALIZE },
            errors: { password: { message: errorMessage } },
        });

        expect(getByText(errorMessage)).toBeInTheDocument();
    });

    it("should not display error message when in sign-in mode", () => {
        const errorMessage = "رمز نامعتبر است";
        const { queryByText } = setup({
            defaultValues: { authForm: AUTH_FORMS.SIGN_IN },
            errors: { password: { message: errorMessage } },
        });

        expect(queryByText(errorMessage)).not.toBeInTheDocument();
    });
});