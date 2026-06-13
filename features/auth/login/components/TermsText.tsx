interface TermsTextProps {
    text: string;
}

export default function TermsText({ text }: TermsTextProps) {
    return (
        <div className="text-center p-4">
            <p className="text-[10px] text-zinc-400 select-none">{text}</p>
        </div>
    );
}
