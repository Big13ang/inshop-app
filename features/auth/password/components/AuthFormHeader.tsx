import { useFormContext, useWatch } from "react-hook-form";
import { AUTH_FORM_HEADERS, AUTH_FORMS, AuthForm, PREVIOUS_STEP_MAP } from "../../constant";
import PhoneNumberBadge from "./PhoneNumberBadge";

export const AuthFormHeader = () => {
    const { setValue } = useFormContext();

    const authForm = (useWatch({ name: 'authForm' }) as AuthForm) || AUTH_FORMS.SIGN_IN;
    const phoneNumber = useWatch({ name: 'phoneNumber' }) as string;

    const handleEditPhoneNumber = () => {
        const targetStep = PREVIOUS_STEP_MAP[authForm] ?? AUTH_FORMS.FORGOT_PASS_INIT;

        setValue('authForm', targetStep, { shouldValidate: true });
    }

    const { title, subTitle } = AUTH_FORM_HEADERS[authForm];
    const showPhoneBadge = Boolean(phoneNumber && PREVIOUS_STEP_MAP[authForm]);

    return (
        <div className="text-center">
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">{title}</h2>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {subTitle}
            </p>

            {showPhoneBadge && (
                <PhoneNumberBadge
                    onEditPhone={handleEditPhoneNumber}
                    phoneNumberBadge={phoneNumber}
                />
            )}
        </div>
    );
};

