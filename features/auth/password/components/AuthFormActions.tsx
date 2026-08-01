import { useFormContext, useWatch } from "react-hook-form";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AUTH_FORM_CONFIG, AUTH_FORMS, AuthForm } from "../../constant";

interface AuthFormActionsProps {
  isLoading?: boolean;
}

export const AuthFormActions = ({ isLoading = false }: AuthFormActionsProps) => {
    const { setValue } = useFormContext();

    const authForm = (useWatch({ name: 'authForm' }) as AuthForm) || AUTH_FORMS.SIGN_IN;
    const config = AUTH_FORM_CONFIG[authForm];

    const handleSecondaryClick = () => {
        if (config.secondaryAction) {
            setValue('authForm', config.secondaryAction.targetForm, { shouldValidate: true });
        }
    };

    return (
        <div className="flex flex-col gap-3 mt-2">
            {/* Primary Submit Button */}
            <Button
                size="xl"
                type="submit"
                variant="filled"
                disabled={isLoading}
                className="w-full"
            >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>لطفاً شکیبا باشید...</span>
                  </>
                ) : (
                  <>
                    <span>{config.submitText}</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
            </Button>

            {/* Secondary Switch Mode Button */}
            {config.secondaryAction && !isLoading && (
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
