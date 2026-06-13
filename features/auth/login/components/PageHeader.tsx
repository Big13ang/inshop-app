interface PageHeaderProps {
    title: string;
    subtitle: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
    return (
        <div className="text-center">
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
                {title}
            </h2>
            <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                {subtitle}
            </p>
        </div>
    );
}
