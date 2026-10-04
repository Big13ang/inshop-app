import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/button';
import { DatePickerTab } from './persianDateUtils';
import { DatePickerProvider, useDatePicker } from './DatePickerContext';
import { DatePickerHeader } from './DatePickerHeader';
import { DatePickerTabs } from './DatePickerTabs';
import { DatePickerSearch } from './DatePickerSearch';
import { DayPickerTab } from './DayPickerTab';
import { MonthPickerTab } from './MonthPickerTab';
import { YearPickerTab } from './YearPickerTab';

export interface PersianDatePickerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: DatePickerTab;
  year: number;
  month: number;
  day: number;
  onDateChange: (year: number, month: number, day: number) => void;
  title?: string;
  minYear?: number;
  maxYear?: number;
}

function stopDragPropagation(e: React.TouchEvent | React.MouseEvent) {
  e.stopPropagation();
}

interface DatePickerDrawerBodyProps {
  title: string;
  onClose: () => void;
}

function DatePickerDrawerBody({ title, onClose }: DatePickerDrawerBodyProps) {
  const { state } = useDatePicker();

  return (
    <div id="persian-date-picker-drawer" dir="rtl" className="flex flex-col h-full">
      <DatePickerHeader title={title} onClose={onClose} />
      <DatePickerTabs />
      <DatePickerSearch />

      <div
        onTouchStart={stopDragPropagation}
        onTouchMove={stopDragPropagation}
        onMouseDown={stopDragPropagation}
        className="h-[270px] min-h-[270px] max-h-[270px] overflow-y-auto pr-0.5 [scrollbar-width:thin] [-ms-overflow-style:none]"
      >
        {state.activeTab === 'day' && <DayPickerTab />}
        {state.activeTab === 'month' && <MonthPickerTab />}
        {state.activeTab === 'year' && <YearPickerTab />}
      </div>

      <div className="pt-4 mt-3 border-t border-container-base">
        <Button
          type="button"
          variant="primary"
          onClick={onClose}
          className="w-full h-11 text-xs font-bold rounded-xl"
        >
          تایید تاریخ
        </Button>
      </div>
    </div>
  );
}

export function PersianDatePickerDrawer({
  isOpen,
  onClose,
  initialTab = 'day',
  year,
  month,
  day,
  onDateChange,
  title = 'انتخاب تاریخ',
  minYear = 1320,
  maxYear = 1405,
}: PersianDatePickerDrawerProps) {
  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content
          variant="drawer"
          className="p-5 text-right font-sans max-h-[85vh] flex flex-col"
        >
          <DatePickerProvider
            key={`${isOpen}-${initialTab}`}
            initialTab={initialTab}
            year={year}
            month={month}
            day={day}
            minYear={minYear}
            maxYear={maxYear}
            onDateChange={onDateChange}
            onClose={onClose}
          >
            <DatePickerDrawerBody title={title} onClose={onClose} />
          </DatePickerProvider>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
