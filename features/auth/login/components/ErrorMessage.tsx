import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
    message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
    return (
        <div className="flex items-start gap-1.5 text-error bg-error/5 p-2.5 rounded-xl border border-error/10 text-[11px] leading-relaxed mt-1 text-right animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 stroke-error" />
            <span className="font-medium">{message}</span>
        </div>
    );
}
