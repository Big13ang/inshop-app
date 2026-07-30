import { useFormContext } from "react-hook-form";
import { AUTH_FORM_HEADERS, AUTH_FORMS, AuthForm, PREVIOUS_STEP_MAP } from "../../constant";

type AuthFormHeaderProps = {
    title: string;
    subTitle: string;
    phoneNumberBadge?: string;
    onEditPhone?: () => void;
}

const PhoneNumberBadge = ({
    onEditPhone,
    phoneNumberBadge
}: Pick<AuthFormHeaderProps, 'phoneNumberBadge' | 'onEditPhone'>) => {
    return <div className="flex items-center justify-center gap-2 mt-3">
        <span className="text-xs font-sans font-medium text-zinc-800 bg-zinc-100 px-3 py-1 rounded-xl border border-zinc-200/80">
            {phoneNumberBadge}
        </span>
        {onEditPhone && (
            <button
                type="button"
                onClick={onEditPhone}
                className="text-xs text-zinc-500 hover:text-zinc-950 transition font-medium underline underline-offset-4 cursor-pointer"
            >
                ویرایش شماره
            </button>
        )}
    </div>
}

export const AuthFormHeader = () => {
    const { watch, setValue } = useFormContext();

    const authForm = watch('authFrom') as AuthForm;
    const phoneNumber = watch('phoneNumber') as string;

    const handleEditPhoneNumber = () => {
        const targetStep = PREVIOUS_STEP_MAP[authForm] ?? AUTH_FORMS.FORGOT_PASS_INIT;

        setValue('authFrom', targetStep);
    }

    const { title, subTitle } = AUTH_FORM_HEADERS[authForm];

    return (
        <div className="text-center">
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">{title}</h2>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {subTitle}
            </p>

            {phoneNumber && (
                <PhoneNumberBadge
                    onEditPhone={handleEditPhoneNumber}
                    phoneNumberBadge={phoneNumber}
                />
            )}
        </div>
    );
};
