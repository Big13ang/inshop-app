import {
  PersianDatePicker,
  type PersianDatePickerProps,
} from '@/components/ui/PersianDatePicker/PersianDatePicker';

export interface AccountBirthDatePickerFieldProps extends PersianDatePickerProps {}

export function AccountBirthDatePickerField({
  drawerTitle = 'انتخاب تاریخ تولد',
  maxYear = 1403,
  minYear = 1320,
  openOnTab = 'day',
  ...props
}: AccountBirthDatePickerFieldProps) {
  return (
    <PersianDatePicker
      drawerTitle={drawerTitle}
      maxYear={maxYear}
      minYear={minYear}
      openOnTab={openOnTab}
      {...props}
    />
  );
}

