import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useDatePicker } from './DatePickerContext';
import { PERSIAN_MONTHS, toPersianDigits } from './persianDateUtils';

export function DatePickerTabs() {
  const { state, actions } = useDatePicker();

  const monthObj = PERSIAN_MONTHS.find((m) => m.monthNumber === state.month);
  const currentMonthLabel = monthObj ? monthObj.label : String(state.month);

  const handleSelectDay = () => actions.setTab('day');
  const handleSelectMonth = () => actions.setTab('month');
  const handleSelectYear = () => actions.setTab('year');

  return (
    <div
      role="tablist"
      aria-label="بخش‌های انتخاب تاریخ"
      className="w-full bg-container-base rounded-xl p-1 flex items-center justify-between border border-container-base mb-3"
    >
      <Button
        id="date-picker-tab-day"
        type="button"
        role="tab"
        variant={state.activeTab === 'day' ? 'secondary' : 'ghost'}
        aria-selected={state.activeTab === 'day'}
        aria-controls="date-picker-panel-day"
        onClick={handleSelectDay}
        className={cn(
          'flex-1 h-auto py-1.5 px-2 rounded-lg text-center text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1',
          state.activeTab === 'day'
            ? 'bg-surface-l3 text-foreground shadow-xs border border-container-base'
            : 'text-secondary hover:text-foreground'
        )}
      >
        <span>روز:</span>
        <span className="font-sans font-bold">{toPersianDigits(state.day)}</span>
      </Button>

      <Button
        id="date-picker-tab-month"
        type="button"
        role="tab"
        variant={state.activeTab === 'month' ? 'secondary' : 'ghost'}
        aria-selected={state.activeTab === 'month'}
        aria-controls="date-picker-panel-month"
        onClick={handleSelectMonth}
        className={cn(
          'flex-1 h-auto py-1.5 px-2 rounded-lg text-center text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1',
          state.activeTab === 'month'
            ? 'bg-surface-l3 text-foreground shadow-xs border border-container-base'
            : 'text-secondary hover:text-foreground'
        )}
      >
        <span>ماه:</span>
        <span>{currentMonthLabel}</span>
      </Button>

      <Button
        id="date-picker-tab-year"
        type="button"
        role="tab"
        variant={state.activeTab === 'year' ? 'secondary' : 'ghost'}
        aria-selected={state.activeTab === 'year'}
        aria-controls="date-picker-panel-year"
        onClick={handleSelectYear}
        className={cn(
          'flex-1 h-auto py-1.5 px-2 rounded-lg text-center text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1',
          state.activeTab === 'year'
            ? 'bg-surface-l3 text-foreground shadow-xs border border-container-base'
            : 'text-secondary hover:text-foreground'
        )}
      >
        <span>سال:</span>
        <span className="font-sans font-bold">{toPersianDigits(state.year)}</span>
      </Button>
    </div>
  );
}
