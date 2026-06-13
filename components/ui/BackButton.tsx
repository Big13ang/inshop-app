import { useTransition } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { Button } from './button';

export interface BackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    ref?: React.Ref<HTMLButtonElement>;
}

export default function BackButton({
    onClick,
    className,
    disabled = false,
    'aria-label': ariaLabel = 'Back',
    ref,
    ...props
}: BackButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        startTransition(() => {
            onClick?.(event);
        });
    };

    return (
        <Button
            ref={ref}
            type="button"
            variant="secondary"
            size="icon-xl"
            shape="circle"
            onClick={handleClick}
            disabled={disabled || isPending}
            aria-label={ariaLabel}
            className={className}
            {...props}
        >
            <span className="relative flex h-full w-full items-center justify-center transform-gpu will-change-transform">
                {isPending ? (
                    <LoaderCircle className="h-5 w-5 animate-spin" strokeWidth={2.5} aria-hidden="true" />
                ) : (
                    <ArrowRight className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                )}
            </span>
        </Button>
    );
}
