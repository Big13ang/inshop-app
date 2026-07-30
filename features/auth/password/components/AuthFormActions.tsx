import { useFormContext } from "react-hook-form";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AUTH_FORM_CONFIG, AUTH_FORMS, AuthForm } from "../../constant";

export const AuthFormActions = () => {
    const { watch, setValue } = useFormContext();

    const authForm = (watch('authFrom') as AuthForm) || AUTH_FORMS.SIGN_IN;
    const config = AUTH_FORM_CONFIG[authForm];

    const handleSecondaryClick = () => {
        if (config.secondaryAction) {
            setValue('authFrom', config.secondaryAction.targetForm);
        }
    };

    return (
        <div className="flex flex-col gap-3 mt-2">
            {/* Primary Submit Button */}
            <Button
                size="xl"
                type="submit"
                variant="filled"
                className="w-full"
            >
                <span>{config.submitText}</span>
                <ArrowLeft className="w-4 h-4" />
            </Button>

            {/* Secondary Switch Mode Button */}
            {config.secondaryAction && (
                <Button
                    type="button"
                    size="xl"
                    variant="outline-primary"
                    onClick={handleSecondaryClick}
                >
                    {config.secondaryAction.text}
                </Button>
            )}
        </div>
    );
};
