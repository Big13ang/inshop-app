import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useDatePicker } from './DatePickerContext';
import { DatePickerEmptyState } from './DatePickerEmptyState';
import { generateYears, toEnglishDigits } from './persianDateUtils';
import { useScrollSelectedIntoView } from './useScrollSelectedIntoView';

export function YearPickerTab() {
  const { state, actions } = useDatePicker();

  const queryEn = toEnglishDigits(state.searchQuery.trim().toLowerCase());
  const trimmedQuery = state.searchQuery.trim();

  // Generate selectable years in descending order between minYear and maxYear
  const availableYears = generateYears(state.minYear, state.maxYear);

  // Filter years by 4-digit number or 2-digit suffix (e.g. 74 or 1374)
  const filteredYears = trimmedQuery
    ? availableYears.filter(
        (y) =>
          y.value.includes(queryEn) ||
          y.persianNumber.includes(trimmedQuery) ||
          y.label.includes(trimmedQuery)
      )
    : availableYears;

  const selectedItemRef = useScrollSelectedIntoView(!trimmedQuery);

  if (filteredYears.length === 0) {
    return <DatePickerEmptyState />;
  }

  return (
    <div
      role="tabpanel"
      id="date-picker-panel-year"
      aria-labelledby="date-picker-tab-year"
      className="grid grid-cols-3 gap-1.5 content-start"
    >
      {filteredYears.map((y) => {
        const isSelected = y.yearNumber === state.year;
        const accessibleLabel = isSelected
          ? `سال ${y.persianNumber}، انتخاب شده`
          : `سال ${y.persianNumber}`;

        const handlePick = () => actions.selectYear(y.yearNumber);

        return (
          <Button
            key={y.value}
            type="button"
            role="button"
            variant={isSelected ? 'primary' : 'outline'}
            aria-pressed={isSelected}
            aria-label={accessibleLabel}
            ref={isSelected ? selectedItemRef : undefined}
            onClick={handlePick}
            className={cn(
              'h-auto py-2 px-2 rounded-xl text-center text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5',
              isSelected
                ? 'bg-primary text-on-primary border-primary shadow-xs'
                : 'bg-surface-l1 hover:bg-container-hover text-foreground border-container-base active:bg-container-active'
            )}
          >
            <span className="font-sans text-xs">{y.persianNumber}</span>
            {isSelected ? (
              <Check aria-hidden="true" className="size-3.5 text-on-primary shrink-0" />
            ) : null}
          </Button>
        );
      })}
    </div>
  );
}
