import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useDatePicker } from './DatePickerContext';
import { DatePickerEmptyState } from './DatePickerEmptyState';
import { PERSIAN_MONTHS, toEnglishDigits } from './persianDateUtils';
import { useScrollSelectedIntoView } from './useScrollSelectedIntoView';

export function MonthPickerTab() {
  const { state, actions } = useDatePicker();

  const queryEn = toEnglishDigits(state.searchQuery.trim().toLowerCase());
  const trimmedQuery = state.searchQuery.trim();

  // Filter Persian months by name, 2-digit code, or 1-12 index (Persian or English)
  const filteredMonths = trimmedQuery
    ? PERSIAN_MONTHS.filter(
        (m) =>
          m.label.includes(trimmedQuery) ||
          m.value.includes(queryEn) ||
          m.index.includes(trimmedQuery) ||
          toEnglishDigits(m.index).includes(queryEn)
      )
    : PERSIAN_MONTHS;

  const selectedItemRef = useScrollSelectedIntoView(!trimmedQuery);

  if (filteredMonths.length === 0) {
    return <DatePickerEmptyState />;
  }

  return (
    <div
      role="tabpanel"
      id="date-picker-panel-month"
      aria-labelledby="date-picker-tab-month"
      className="grid grid-cols-2 gap-2 content-start"
    >
      {filteredMonths.map((m) => {
        const isSelected = m.monthNumber === state.month;
        const accessibleLabel = isSelected
          ? `ماه ${m.label}، انتخاب شده`
          : `ماه ${m.label}`;

        const handlePick = () => actions.selectMonth(m.monthNumber);

        return (
          <Button
            key={m.value}
            type="button"
            role="button"
            variant={isSelected ? 'primary' : 'outline'}
            aria-pressed={isSelected}
            aria-label={accessibleLabel}
            ref={isSelected ? selectedItemRef : undefined}
            onClick={handlePick}
            className={cn(
              'h-auto p-2.5 rounded-xl text-right text-xs font-bold transition-all cursor-pointer border flex items-center justify-between',
              isSelected
                ? 'bg-primary text-on-primary border-primary shadow-xs'
                : 'bg-surface-l1 hover:bg-container-hover text-foreground border-container-base active:bg-container-active'
            )}
          >
            <div className="flex flex-col">
              <span>{m.label}</span>
              <span
                className={cn(
                  'text-[10px] font-normal',
                  isSelected ? 'text-on-primary/80' : 'text-secondary'
                )}
              >
                ماه {m.index}
              </span>
            </div>
            {isSelected ? (
              <Check aria-hidden="true" className="size-4 text-on-primary shrink-0" />
            ) : null}
          </Button>
        );
      })}
    </div>
  );
}
