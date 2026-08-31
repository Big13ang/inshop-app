import type { SVGProps, Ref } from 'react';

export interface AddIconProps extends SVGProps<SVGSVGElement> {
    color?: string;
    ref?: Ref<SVGSVGElement>;
}

const PLUS_PATH =
    'M21 11h-8V3a1 1 0 1 0-2 0v8H3a1 1 0 1 0 0 2h8v8a1 1 0 1 0 2 0v-8h8a1 1 0 1 0 0-2Z';

export function AddIcon({
    width = 24,
    height = 24,
    color = 'currentColor',
    viewBox = '0 0 24 24',
    ref,
    children,
    ...props
}: AddIconProps) {
    return (
        <svg
            ref={ref}
            viewBox={viewBox}
            width={width}
            height={height}
            fill={color}
            {...props}
        >
            <path d={PLUS_PATH} />
            {children}
        </svg>
    );
}
