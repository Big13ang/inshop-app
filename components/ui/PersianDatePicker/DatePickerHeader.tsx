import { Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDatePicker } from './DatePickerContext';
import { PERSIAN_MONTHS, toPersianDigits } from './persianDateUtils';

export interface DatePickerHeaderProps {
  title?: string;
  onClose: () => void;
}

export function DatePickerHeader({
  title = 'انتخاب تاریخ',
  onClose,
}: DatePickerHeaderProps) {
  const { state } = useDatePicker();

  const monthObj = PERSIAN_MONTHS.find((m) => m.monthNumber === state.month);
  const currentMonthLabel = monthObj ? monthObj.label : String(state.month);
  const formattedSubtitle = `${toPersianDigits(state.day)} ${currentMonthLabel} ${toPersianDigits(state.year)}`;

  return (
    <div className="flex items-center justify-between pb-3 border-b border-container-base mb-3">
      <div className="flex items-center gap-2.5">
        <div
          aria-hidden="true"
          className="size-8 rounded-full bg-container-base flex items-center justify-center text-foreground"
        >
          <Calendar className="size-4" />
        </div>
        <div>
          <h3 id="date-picker-drawer-title" className="text-sm font-bold text-foreground">
            {title}
          </h3>
          <p className="text-[11px] text-secondary font-sans" aria-label={`تاریخ انتخاب شده: ${formattedSubtitle}`}>
            {formattedSubtitle}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onClose}
        aria-label="بستن"
        className="rounded-full text-secondary hover:text-foreground"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
