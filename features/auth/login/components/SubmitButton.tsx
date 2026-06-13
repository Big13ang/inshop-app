import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isSubmitting?: boolean;
    submittingText?: string;
    ref?: React.Ref<HTMLButtonElement>;
}

export default function SubmitButton({
    isSubmitting = false,
    submittingText,
    children,
    className,
    ref,
    ...props
}: SubmitButtonProps) {
    return (
        <Button
            ref={ref}
            type="submit"
            variant="filled"
            size="xl"
            disabled={isSubmitting || props.disabled}
            className={className}
            {...props}
        >
            <span>
                {isSubmitting && submittingText ? submittingText : children}
            </span>
            {isSubmitting ? (
                <LoaderCircle className="w-4 h-4 animate-spin" strokeWidth={2.5} aria-hidden="true" />
            ) : (
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            )}
        </Button>
    );
}
