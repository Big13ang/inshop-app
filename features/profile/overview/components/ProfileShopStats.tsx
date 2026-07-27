import { text } from "../../constants";

export function ShopStats({ publishedCount }: { publishedCount: number }) {
    return (
        <div className="flex-grow flex items-center justify-start pb-2 text-primary" dir="rtl">
            <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-primary">{publishedCount}</span>
                <span className="text-xs text-secondary">{text.overview.statPublished}</span>
            </div>
        </div>
    );
}