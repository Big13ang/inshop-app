import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDatePicker } from './DatePickerContext';
import { toEnglishDigits, toPersianDigits } from './persianDateUtils';

function stopDragPropagation(e: React.TouchEvent | React.MouseEvent) {
  e.stopPropagation();
}

export function DatePickerSearch() {
  const { state, actions } = useDatePicker();
  const inputRef = useRef<HTMLInputElement>(null);

  const getPlaceholder = () => {
    if (state.activeTab === 'day') {
      return 'جستجو در روزها (مثال: ۱۵ یا 15)...';
    }
    if (state.activeTab === 'month') {
      return 'جستجو در ماه‌ها (مثال: شهریور یا ۶)...';
    }
    return `جستجو در سال‌ها (مثال: ${toPersianDigits(state.year)} یا ${toEnglishDigits(String(state.year)).slice(-2)})...`;
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    actions.setSearchQuery(e.target.value);
  };

  const handleClear = () => {
    actions.clearSearch();
    inputRef.current?.focus();
  };

  return (
    <div className="relative mb-3">
      <Input
        ref={inputRef}
        type="search"
        role="searchbox"
        inputSize="sm"
        aria-label="جستجوی روز، ماه یا سال"
        value={state.searchQuery}
        onChange={handleSearchChange}
        placeholder={getPlaceholder()}
        className="w-full bg-surface-l1 border-container-base rounded-xl pr-9 pl-9 text-xs text-foreground placeholder:text-secondary/70 focus:outline-none focus:border-foreground transition-colors [appearance:textfield] [&::-webkit-search-cancel-button]:hidden"
        dir="rtl"
        onTouchStart={stopDragPropagation}
        onMouseDown={stopDragPropagation}
      />
      <Search
        aria-hidden="true"
        className="size-4 text-secondary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
      />
      {state.searchQuery ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          shape="circle"
          onClick={handleClear}
          aria-label="پاک کردن جستجو"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 size-5 bg-container-hover text-secondary hover:text-foreground hover:bg-container-active"
        >
          <X className="size-3" />
        </Button>
      ) : null}
    </div>
  );
}
