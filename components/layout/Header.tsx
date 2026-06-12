import BackButton, { BackButtonProps } from '@/components/ui/BackButton';
import { cn } from '@/lib/utils';

export interface HeaderRootProps extends React.HTMLAttributes<HTMLElement> {
    children?: React.ReactNode;
}

export function HeaderRoot({ children, className, ...props }: HeaderRootProps) {
    return (
        <header
            className={cn(
                'bg-surface-l3 border-b border-primary/5 h-16 flex items-center justify-between px-4 sticky top-0 z-50 shrink-0 w-full select-none',
                className,
            )}
            {...props}
        >
            {children}
        </header>
    );
}

export interface HeaderTitleProps extends React.HTMLAttributes<HTMLSpanElement> {
    children?: React.ReactNode;
}

export function HeaderTitle({ children, className, ...props }: HeaderTitleProps) {
    return (
        <span
            className={cn(
                'font-bold text-sm text-primary absolute left-1/2 -translate-x-1/2 pointer-events-none',
                className,
            )}
            {...props}
        >
            {children}
        </span>
    );
}

export type HeaderBackProps = BackButtonProps;

export function HeaderBack({ className, ...props }: HeaderBackProps) {
    return <BackButton className={className} {...props} />;
}

export interface HeaderRightProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
}

export function HeaderRight({ children, className, ...props }: HeaderRightProps) {
    return (
        <div className={cn('w-10 flex items-center justify-end', className)} {...props}>
            {children}
        </div>
    );
}

export const Header = {
    Root: HeaderRoot,
    Back: HeaderBack,
    Title: HeaderTitle,
    Right: HeaderRight,
};

export default Header;
