import { memo, useCallback, useTransition } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface BackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const BackButton = memo(function BackButton({
    onClick,
    className,
    disabled = false,
    'aria-label': ariaLabel = 'Back',
    ...props
}: BackButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleClick = useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            startTransition(() => {
                onClick?.(event);
            });
        },
        [onClick],
    );

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={disabled}
            aria-label={ariaLabel}
            className={cn(
                'flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-zinc-200/10 bg-zinc-100/95 text-zinc-900 shadow-sm transition-all duration-200 hover:bg-zinc-200/90 active:scale-95',
                'disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20',
                className,
            )}
            {...props}
        >
            <span className="relative flex h-full w-full items-center justify-center transform-gpu will-change-transform">
                {isPending ? (
                    <LoaderCircle className="h-5 w-5 animate-spin" strokeWidth={2.5} aria-hidden="true" />
                ) : (
                    <ArrowRight className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                )}
            </span>
        </button>
    );
});

BackButton.displayName = 'BackButton';

export default BackButton;
