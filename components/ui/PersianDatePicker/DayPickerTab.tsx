import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useDatePicker } from './DatePickerContext';
import { DatePickerEmptyState } from './DatePickerEmptyState';
import { generateDays, toEnglishDigits } from './persianDateUtils';
import { useScrollSelectedIntoView } from './useScrollSelectedIntoView';

export function DayPickerTab() {
  const { state, actions } = useDatePicker();

  const queryEn = toEnglishDigits(state.searchQuery.trim().toLowerCase());
  const trimmedQuery = state.searchQuery.trim();

  // Generate days dynamically based on the current year and month (handles leap years & 29/30/31 days)
  const availableDays = generateDays(state.year, state.month);

  // Filter days by Persian digit, English digit, raw number, or Persian label
  const filteredDays = trimmedQuery
    ? availableDays.filter(
        (d) =>
          d.value.includes(queryEn) ||
          d.rawNumber.includes(queryEn) ||
          d.persianNumber.includes(trimmedQuery) ||
          d.label.includes(trimmedQuery)
      )
    : availableDays;

  const selectedItemRef = useScrollSelectedIntoView(!trimmedQuery);

  if (filteredDays.length === 0) {
    return <DatePickerEmptyState />;
  }

  return (
    <div
      role="tabpanel"
      id="date-picker-panel-day"
      aria-labelledby="date-picker-tab-day"
      className="grid grid-cols-4 gap-1.5 content-start"
    >
      {filteredDays.map((d) => {
        const isSelected = d.dayNumber === state.day;
        const accessibleLabel = isSelected
          ? `روز ${d.persianNumber}، انتخاب شده`
          : `روز ${d.persianNumber}`;

        const handlePick = () => actions.selectDay(d.dayNumber);

        return (
          <Button
            key={d.value}
            type="button"
            role="button"
            variant={isSelected ? 'primary' : 'outline'}
            aria-pressed={isSelected}
            aria-label={accessibleLabel}
            ref={isSelected ? selectedItemRef : undefined}
            onClick={handlePick}
            className={cn(
              'h-auto py-2 px-2 rounded-xl text-center text-xs font-bold transition-all cursor-pointer border flex flex-col items-center justify-center',
              isSelected
                ? 'bg-primary text-on-primary border-primary shadow-xs'
                : 'bg-surface-l1 hover:bg-container-hover text-foreground border-container-base active:bg-container-active'
            )}
          >
            <span className="font-sans text-sm">{d.persianNumber}</span>
            <span
              className={cn(
                'text-[10px] font-normal',
                isSelected ? 'text-on-primary/80' : 'text-secondary'
              )}
            >
              {isSelected ? 'انتخاب شده' : 'روز'}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
