import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DatePickerTab,
  PERSIAN_MONTHS,
  toPersianDigits,
  parsePersianDate,
  formatPersianDate,
  formatPersianDisplayDate,
} from './persianDateUtils';
import { PersianDatePickerDrawer } from './PersianDatePickerDrawer';

export interface PersianDatePickerProps {
  /** Value string in "YYYY/MM/DD" or "YYYY-MM-DD" format */
  value?: string;
  /** Callback fired when date value changes */
  onChange?: (date: string) => void;
  /** Optional field label */
  label?: string;
  /** Optional helper text below the field */
  helperText?: string;
  /** Optional error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Title displayed in drawer bottom sheet */
  drawerTitle?: string;
  /** Minimum selectable Persian year (default: 1320) */
  minYear?: number;
  /** Maximum selectable Persian year (default: 1405) */
  maxYear?: number;
  /** If provided, all triggers open this tab instead of their respective tab */
  openOnTab?: DatePickerTab;
  /** Root container className */
  className?: string;
  /** ID for accessibility */
  id?: string;
}

export function PersianDatePicker({
  value,
  onChange,
  label,
  helperText,
  error,
  disabled = false,
  drawerTitle = 'انتخاب تاریخ',
  minYear = 1320,
  maxYear = 1405,
  openOnTab,
  className,
  id,
}: PersianDatePickerProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DatePickerTab>('day');

  // Derive parsed date values directly from value prop during render
  const parsed = parsePersianDate(value);
  const monthObj = PERSIAN_MONTHS.find((m) => m.monthNumber === parsed.month);
  const monthLabel = monthObj ? monthObj.label : String(parsed.month);
  const formattedDisplay = formatPersianDisplayDate(value);

  const openDayTab = () => {
    if (disabled) return;
    setDrawerTab(openOnTab ?? 'day');
    setIsDrawerOpen(true);
  };

  const openMonthTab = () => {
    if (disabled) return;
    setDrawerTab(openOnTab ?? 'month');
    setIsDrawerOpen(true);
  };

  const openYearTab = () => {
    if (disabled) return;
    setDrawerTab(openOnTab ?? 'year');
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleDateChange = (newYear: number, newMonth: number, newDay: number) => {
    const formatted = formatPersianDate(newYear, newMonth, newDay);
    onChange?.(formatted);
  };

  return (
    <div id={id} className={cn('w-full', className)}>
      {/* Header with Title and Formatted Live Date */}
      {label ? (
        <div className="flex items-center justify-between mb-1.5 px-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-secondary" />
            <span className="text-xs font-bold text-secondary">
              {label}
            </span>
          </div>
          <span className="text-xs text-secondary font-sans" dir="rtl">
            {formattedDisplay}
          </span>
        </div>
      ) : formattedDisplay ? (
        <div className="flex items-center justify-end mb-1 px-1">
          <span className="text-xs text-secondary font-sans" dir="rtl">
            {formattedDisplay}
          </span>
        </div>
      ) : null}

      {/* 3-Column Trigger Selectors: Day, Month, Year */}
      <div className="grid grid-cols-3 gap-2" dir="rtl">
        {/* Day Trigger */}
        <div>
          <label className="text-[10px] text-secondary font-medium block mb-1 px-1">روز</label>
          <button
            type="button"
            disabled={disabled}
            onClick={openDayTab}
            className="w-full bg-surface-l1 hover:bg-container-hover border border-container-base disabled:opacity-50 rounded-xl px-2.5 py-2 text-xs text-foreground font-sans flex items-center justify-between transition-colors cursor-pointer active:scale-[0.98]"
          >
            <span className="font-bold text-foreground">{toPersianDigits(parsed.day)}</span>
            <ChevronDown className="size-3.5 text-secondary" />
          </button>
        </div>

        {/* Month Trigger */}
        <div>
          <label className="text-[10px] text-secondary font-medium block mb-1 px-1">ماه</label>
          <button
            type="button"
            disabled={disabled}
            onClick={openMonthTab}
            className="w-full bg-surface-l1 hover:bg-container-hover border border-container-base disabled:opacity-50 rounded-xl px-2.5 py-2 text-xs text-foreground font-sans flex items-center justify-between transition-colors cursor-pointer active:scale-[0.98]"
          >
            <span className="font-bold text-foreground truncate">
              {monthLabel}
            </span>
            <ChevronDown className="size-3.5 text-secondary shrink-0 mr-1" />
          </button>
        </div>

        {/* Year Trigger */}
        <div>
          <label className="text-[10px] text-secondary font-medium block mb-1 px-1">سال</label>
          <button
            type="button"
            disabled={disabled}
            onClick={openYearTab}
            className="w-full bg-surface-l1 hover:bg-container-hover border border-container-base disabled:opacity-50 rounded-xl px-2.5 py-2 text-xs text-foreground font-sans flex items-center justify-between transition-colors cursor-pointer active:scale-[0.98]"
          >
            <span className="font-bold text-foreground">{toPersianDigits(parsed.year)}</span>
            <ChevronDown className="size-3.5 text-secondary" />
          </button>
        </div>
      </div>

      {/* Error or Helper Text */}
      {error || helperText ? (
        <div className="min-h-[16px] px-1 mt-1 text-[11px]">
          {error ? (
            <span className="font-medium text-error">{error}</span>
          ) : (
            <span className="text-secondary">{helperText}</span>
          )}
        </div>
      ) : null}

      {/* Bottom Sheet Drawer */}
      <PersianDatePickerDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        initialTab={drawerTab}
        year={parsed.year}
        month={parsed.month}
        day={parsed.day}
        onDateChange={handleDateChange}
        title={drawerTitle}
        minYear={minYear}
        maxYear={maxYear}
      />
    </div>
  );
}
