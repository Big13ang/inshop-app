import { useWatch } from "react-hook-form";
import { AUTH_FORM_HEADERS, AUTH_FORMS, AuthForm } from "../../constant";

export const AuthFormHeader = () => {
    const authForm = (useWatch({ name: 'authForm' }) as AuthForm) || AUTH_FORMS.SIGN_IN;

    const { title, subTitle } = AUTH_FORM_HEADERS[authForm];

    return (
        <div className="text-center">
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">{title}</h2>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {subTitle}
            </p>
        </div>
    );
};


