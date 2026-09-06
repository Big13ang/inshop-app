import { AlertCircle } from 'lucide-react';

export interface SearchErrorStateProps {
  title?: string;
  description?: string;
  id?: string;
}

export function SearchErrorState({
  title = 'خطا در دریافت نتایج',
  description = 'مشکلی در برقراری ارتباط با سرور رخ داده است. لطفاً دوباره تلاش کنید.',
  id = 'search-error-state',
}: SearchErrorStateProps) {
  return (
    <div
      id={id}
      className="py-16 px-6 flex flex-col items-center justify-center text-center select-none"
      dir="rtl"
    >
      <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4 border border-zinc-200/60">
        <AlertCircle className="w-7 h-7 text-zinc-500" strokeWidth={1.5} />
      </div>

      <h3 className="font-bold text-zinc-900 text-sm mb-1.5 font-sans">
        {title}
      </h3>

      <p className="text-zinc-500 text-xs leading-5 max-w-[260px]">
        {description}
      </p>
    </div>
  );
}
