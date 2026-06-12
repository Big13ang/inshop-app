import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FooterTabConfig {
    id: string;
    icon?: LucideIcon;
    onPress?: () => void;
    isActionButton?: boolean;
    customRender?: (isActive: boolean) => React.ReactNode;
    label?: string;
    variant?: string;
}

export interface FooterTabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: LucideIcon;
    isActive?: boolean;
    customRender?: (isActive: boolean) => React.ReactNode;
}

export function FooterTab({
    icon: Icon,
    isActive = false,
    customRender,
    className,
    ...props
}: FooterTabProps) {
    return (
        <button
            type="button"
            aria-current={isActive ? 'page' : undefined}
            className={cn(
                'w-11 h-11 flex items-center justify-center shrink-0',
                'outline-none select-none',
                'active:opacity-60 transition-opacity duration-150 rounded-lg hover:cursor-pointer',
                className,
            )}
            {...props}
        >
            {customRender ? (
                customRender(isActive)
            ) : Icon ? (
                <Icon
                    className={cn(
                        'w-[31px] h-[31px] transition-colors duration-150',
                        isActive ? 'text-primary' : 'text-secondary',
                    )}
                    strokeWidth={isActive ? 2.5 : 1.75}
                    fill={isActive ? 'currentColor' : 'none'}
                />
            ) : null}
        </button>
    );
}

export interface FooterNavRootProps {
    activeTab: string;
    onTabChange: (tabId: string) => void;
    tabs: FooterTabConfig[];
    className?: string;
    style?: React.CSSProperties;
}

export function FooterNavRoot({
    activeTab,
    onTabChange,
    tabs,
    className,
    style,
}: FooterNavRootProps) {
    return (
        <nav
            role="navigation"
            aria-label="Bottom Navigation"
            className={cn(
                'absolute bottom-0 left-0 right-0 w-full z-50',
                'h-16',
                'bg-white border-t border-zinc-100',
                'flex flex-row items-center justify-around px-4',
                'select-none',
                className,
            )}
            style={style}
        >
            {tabs.map((tab) => (
                <FooterTab
                    key={tab.id}
                    icon={tab.icon}
                    isActive={!tab.isActionButton && activeTab === tab.id}
                    customRender={tab.customRender}
                    onClick={() => (tab.onPress ? tab.onPress() : onTabChange(tab.id))}
                />
            ))}
        </nav>
    );
}

export interface FooterRootProps extends React.HTMLAttributes<HTMLElement> {
    children?: React.ReactNode;
}

export function FooterRoot({ children, className, ...props }: FooterRootProps) {
    return (
        <footer
            className={cn(
                'absolute bottom-0 left-0 right-0 w-full z-50',
                'bg-white border-t border-zinc-100',
                'p-4 shrink-0',
                className,
            )}
            {...props}
        >
            {children}
        </footer>
    );
}

export interface FooterNavProps extends React.HTMLAttributes<HTMLElement> {
    children?: React.ReactNode;
}

export function FooterNav({ children, className, ...props }: FooterNavProps) {
    return (
        <nav
            className={cn(
                'absolute bottom-0 left-0 right-0 w-full z-50',
                'bg-white border-t border-zinc-100',
                'p-4 shrink-0',
                className,
            )}
            {...props}
        >
            {children}
        </nav>
    );
}

export interface FooterButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children?: React.ReactNode;
    variant?: 'primary' | 'outline';
}

export function FooterButton({ children, className, variant = 'primary', ...props }: FooterButtonProps) {
    return (
        <button
            className={cn(
                'h-12 font-bold text-sm rounded-xl active:scale-[0.98] transition-all cursor-pointer',
                'disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2',
                variant === 'primary'
                    ? 'bg-primary text-on-primary'
                    : 'border border-primary text-primary bg-transparent hover:bg-primary/5',
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
}

export const Footer = {
    Nav: FooterNavRoot,
    Root: FooterRoot,
    FooterNav,
    Tab: FooterTab,
    Button: FooterButton,
};

export default Footer;
