'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Drawer } from 'vaul';
import { Check, ChevronDown, ChevronUp, ChevronsUpDown, Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Input } from '@/features/campaign/ui/input';
import { useMediaQuery } from './useMediaQuery';

type SelectOption = string | { id: string; title: string };

interface CustomSearchableSelectProps<T extends SelectOption> {
  options: T[];
  value?: string;
  onChange: (val: string) => void;
  placeholder: string;
  disabled?: boolean;
  error?: boolean;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
}

const searchInputReset = 'w-full min-w-0 rounded-none border-0 bg-transparent px-0 pr-2 text-right font-medium shadow-none outline-none placeholder:text-stone-400 focus-visible:ring-0 focus-visible:border-0';

const isSelectKey = (event: React.KeyboardEvent) => event.key === 'Enter' || event.key === ' ';

export const CustomSearchableSelect = <T extends SelectOption>({
  options,
  value = '',
  onChange,
  placeholder,
  disabled,
  error,
  ariaLabelledBy,
  ariaDescribedBy,
}: CustomSearchableSelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const getLabel = (opt: T) => (typeof opt === 'string' ? opt : opt.title);
  const getId = (opt: T) => (typeof opt === 'string' ? opt : opt.id);

  const filteredOptions = options.filter((opt) =>
    getLabel(opt).toLowerCase().includes(search.toLowerCase())
  );

  const updateScrollIndicators = (el: HTMLElement) => {
    const maxScrollTop = el.scrollHeight - el.clientHeight;
    setCanScrollUp(el.scrollTop > 4);
    setCanScrollDown(el.scrollTop < maxScrollTop - 4 && maxScrollTop > 0);
  };

  // Re-measures whenever the list or its content resizes (opening, filtering, viewport changes).
  const attachOptionsScroll = (el: HTMLDivElement | null) => {
    if (!el) return;
    updateScrollIndicators(el);
    const observer = new ResizeObserver(() => updateScrollIndicators(el));
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  };

  const handleOptionsScroll = (event: React.UIEvent<HTMLDivElement>) => {
    updateScrollIndicators(event.currentTarget);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const selectedOption = options.find((opt) => getId(opt) === value);
  const actualDisplayValue = selectedOption ? getLabel(selectedOption) : '';

  const selectOption = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearch('');
  };

  const handleOptionKeyDown = (event: React.KeyboardEvent, id: string) => {
    if (!isSelectKey(event)) return;
    event.preventDefault();
    selectOption(id);
  };

  const closeDropdown = () => setIsOpen(false);

  const toggleOpen = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled || !isSelectKey(event)) return;
    event.preventDefault();
    setIsOpen(!isOpen);
  };

  const renderOptions = (isMobileView = false) => (
    <div
      ref={attachOptionsScroll}
      onScroll={handleOptionsScroll}
      data-vaul-no-drag
      className={cn(
        'overflow-y-auto overscroll-contain p-1.5 custom-scrollbar [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]',
        isMobileView ? 'flex-1 min-h-0' : 'max-h-[320px] md:max-h-[224px]'
      )}
      role="listbox"
    >
      <div>
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => {
            const label = getLabel(option);
            const id = getId(option);
            const isSelected = value === id;

            return (
              <div
                key={id}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onKeyDown={(event) => handleOptionKeyDown(event, id)}
                onClick={() => selectOption(id)}
                className={cn(
                  'flex items-center justify-between py-4 md:py-3 px-4 text-right cursor-pointer rounded-xl font-medium transition-all mb-1 md:mb-0.5 outline-none focus:bg-rose-50 focus:text-rose-600 focus:ring-2 focus:ring-rose-600/20',
                  isSelected
                    ? 'bg-rose-50 text-rose-600 shadow-sm'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                )}
              >
                <span className="flex-1 text-base md:text-sm">{label}</span>
                {isSelected && <Check className="ml-1 h-5 w-5 md:h-4 md:w-4 animate-in zoom-in-50 duration-300" />}
              </div>
            );
          })
        ) : (
          <div className="py-12 md:py-8 text-center text-stone-400 text-sm font-medium">
            موردی پیدا نشد
          </div>
        )}
      </div>
    </div>
  );

  const scrollUpIndicator = canScrollUp && (
    <div className="pointer-events-none absolute top-1 left-0 right-0 z-10 flex justify-center">
      <div className="rounded-full bg-white/95 border border-stone-200 p-0.5 shadow-sm">
        <ChevronUp className="h-3 w-3 text-stone-400" />
      </div>
    </div>
  );

  const scrollDownIndicator = canScrollDown && (
    <div className="pointer-events-none absolute bottom-1 left-0 right-0 z-10 flex justify-center">
      <div className="rounded-full bg-white/95 border border-stone-200 p-0.5 shadow-sm">
        <ChevronDown className="h-3 w-3 text-stone-400" />
      </div>
    </div>
  );

  const trigger = (
    <div
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      aria-invalid={!!error}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      onClick={toggleOpen}
      className={cn(
        'w-full flex items-center justify-between h-14 rounded-2xl border bg-white px-4 text-base font-medium transition-all text-right group outline-none focus:border-rose-600 focus:ring-4 focus:ring-rose-600/10',
        isOpen ? 'border-rose-600 ring-4 ring-rose-600/10 shadow-lg shadow-rose-500/5' : 'border-stone-200 hover:border-stone-300',
        error && !isOpen && 'border-rose-500 bg-rose-50/10',
        disabled ? 'opacity-50 cursor-not-allowed bg-stone-50' : 'cursor-pointer',
        !value && 'text-stone-400'
      )}
    >
      <span className="truncate">{actualDisplayValue || placeholder}</span>
      <ChevronsUpDown
        className={cn(
          'ml-2 h-5 w-5 shrink-0 transition-opacity',
          isOpen ? 'opacity-100 text-rose-600' : 'opacity-40 group-hover:opacity-100'
        )}
      />
    </div>
  );

  if (isMobile) {
    return (
      <div className="w-full">
        {trigger}
        <Drawer.Root open={isOpen} onOpenChange={setIsOpen} shouldScaleBackground>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[200]" />
            <Drawer.Content
              className="bg-white flex flex-col rounded-t-[2rem] max-h-[85dvh] fixed bottom-0 left-0 right-0 z-[201] focus:outline-none shadow-2xl"
              dir="rtl"
            >
              <div className="p-5 bg-white rounded-t-[2rem] flex flex-col overflow-hidden pb-[max(1.5rem,env(safe-area-inset-bottom))] min-h-0 flex-1">
                <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-stone-200 mb-6" />
                <div className="flex items-center border-b border-stone-100 px-3 mb-4 bg-stone-50 rounded-2xl flex-shrink-0">
                  <Search className="h-5 w-5 shrink-0 text-stone-400" />
                  <Input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="جستجو..."
                    className={cn(searchInputReset, 'h-14 text-base')}
                  />
                </div>
                <div className="relative flex-1 min-h-0 flex flex-col">
                  {scrollUpIndicator}
                  {renderOptions(true)}
                  {scrollDownIndicator}
                </div>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Transparent layer under the dropdown that closes it on any outside press. */}
      {isOpen && <div aria-hidden="true" className="fixed inset-0 z-[199]" onMouseDown={closeDropdown} />}
      {trigger}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 mt-2 z-[200] bg-white rounded-2xl border border-stone-200 shadow-2xl shadow-stone-200/60 overflow-hidden"
            dir="rtl"
          >
            <div className="flex items-center border-b border-stone-100 px-3 bg-stone-50/50">
              <Search className="h-4 w-4 shrink-0 text-stone-400" />
              <Input
                autoFocus
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="جستجو..."
                className={cn(searchInputReset, 'h-12 text-sm md:text-sm')}
              />
            </div>
            <div className="relative">
              {scrollUpIndicator}
              {renderOptions()}
              {scrollDownIndicator}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
