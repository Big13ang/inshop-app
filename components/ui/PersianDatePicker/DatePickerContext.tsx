import * as React from 'react';
import { DatePickerTab, clampDayToMonth } from './persianDateUtils';

export interface DatePickerState {
  activeTab: DatePickerTab;
  searchQuery: string;
  year: number;
  month: number;
  day: number;
  minYear: number;
  maxYear: number;
}

export interface DatePickerActions {
  setTab: (tab: DatePickerTab) => void;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  selectDay: (day: number) => void;
  selectMonth: (month: number) => void;
  selectYear: (year: number) => void;
}

export interface DatePickerContextValue {
  state: DatePickerState;
  actions: DatePickerActions;
}

const DatePickerContext = React.createContext<DatePickerContextValue | null>(null);

export function useDatePicker(): DatePickerContextValue {
  const context = React.use(DatePickerContext);
  if (!context) {
    throw new Error('useDatePicker must be used within DatePickerProvider');
  }
  return context;
}

export interface DatePickerProviderProps {
  initialTab?: DatePickerTab;
  year: number;
  month: number;
  day: number;
  minYear?: number;
  maxYear?: number;
  onDateChange: (year: number, month: number, day: number) => void;
  onClose?: () => void;
  children: React.ReactNode;
}

export function DatePickerProvider({
  initialTab = 'day',
  year,
  month,
  day,
  minYear = 1320,
  maxYear = 1405,
  onDateChange,
  onClose,
  children,
}: DatePickerProviderProps) {
  const [activeTab, setActiveTab] = React.useState<DatePickerTab>(initialTab);
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSetTab = (tab: DatePickerTab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  const handleSetSearchQuery = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleSelectDay = (selectedDay: number) => {
    onDateChange(year, month, selectedDay);
    setActiveTab('month');
    setSearchQuery('');
  };

  const handleSelectMonth = (selectedMonth: number) => {
    const clampedDay = clampDayToMonth(year, selectedMonth, day);
    onDateChange(year, selectedMonth, clampedDay);
    setActiveTab('year');
    setSearchQuery('');
  };

  const handleSelectYear = (selectedYear: number) => {
    const clampedDay = clampDayToMonth(selectedYear, month, day);
    onDateChange(selectedYear, month, clampedDay);
    onClose?.();
  };

  const value: DatePickerContextValue = {
    state: {
      activeTab,
      searchQuery,
      year,
      month,
      day,
      minYear,
      maxYear,
    },
    actions: {
      setTab: handleSetTab,
      setSearchQuery: handleSetSearchQuery,
      clearSearch: handleClearSearch,
      selectDay: handleSelectDay,
      selectMonth: handleSelectMonth,
      selectYear: handleSelectYear,
    },
  };

  return <DatePickerContext value={value}>{children}</DatePickerContext>;
}
