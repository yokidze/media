'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { StyledSelect } from '@/components/StyledSelect';
import { useLanguage } from '@/components/LanguageProvider';

interface DatePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface CalendarCell {
  date: Date;
  inCurrentMonth: boolean;
}

const WEEK_DAYS_RUS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WEEK_DAYS_KAZ = ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб', 'Жс'];
const MONTHS_RUS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTHS_KAZ = ['Қаңтар', 'Ақпан', 'Наурыз', 'Сәуір', 'Мамыр', 'Маусым', 'Шілде', 'Тамыз', 'Қыркүйек', 'Қазан', 'Қараша', 'Желтоқсан'];

const MIN_YEAR = 1950;
const MAX_YEAR = new Date().getFullYear() + 10;

const parseIsoDate = (value: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
};

const formatIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (date: Date): string => `${`${date.getDate()}`.padStart(2, '0')}.${`${date.getMonth() + 1}`.padStart(2, '0')}.${date.getFullYear()}`;

const daysInMonth = (year: number, monthIndex: number): number => new Date(year, monthIndex + 1, 0).getDate();

const clampDay = (year: number, monthIndex: number, day: number): number => Math.min(Math.max(day, 1), daysInMonth(year, monthIndex));

const buildCalendarCells = (monthDate: Date): CalendarCell[] => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const count = monthEnd.getDate();

  const firstWeekDay = (monthStart.getDay() + 6) % 7;
  const cells: CalendarCell[] = [];

  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstWeekDay - 1; i >= 0; i -= 1) {
    cells.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      inCurrentMonth: false
    });
  }

  for (let day = 1; day <= count; day += 1) {
    cells.push({
      date: new Date(year, month, day),
      inCurrentMonth: true
    });
  }

  while (cells.length < 42) {
    const day = cells.length - (firstWeekDay + count) + 1;
    cells.push({
      date: new Date(year, month + 1, day),
      inCurrentMonth: false
    });
  }

  return cells;
};

const isSameDay = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();

export function DatePickerInput({ value, onChange, placeholder }: DatePickerInputProps): React.JSX.Element {
  const { language } = useLanguage();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedDate = parseIsoDate(value);
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => selectedDate ?? new Date());
  const calendarCells = useMemo(() => buildCalendarCells(viewDate), [viewDate]);

  const weekDays = language === 'kaz' ? WEEK_DAYS_KAZ : WEEK_DAYS_RUS;
  const months = language === 'kaz' ? MONTHS_KAZ : MONTHS_RUS;
  const placeholderText = placeholder ?? (language === 'kaz' ? 'КК.АА.ЖЖЖЖ' : 'ДД.ММ.ГГГГ');

  useEffect(() => {
    const parsed = parseIsoDate(value);
    if (!parsed) return;
    setViewDate(parsed);
  }, [value]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const baseDate = selectedDate ?? viewDate;
  const currentYear = viewDate.getFullYear();
  const currentMonthIndex = viewDate.getMonth();
  const currentDay = clampDay(currentYear, currentMonthIndex, baseDate.getDate());

  const yearOptions = useMemo(() => {
    const years: Array<{ value: string; label: string }> = [];
    for (let year = MAX_YEAR; year >= MIN_YEAR; year -= 1) {
      years.push({ value: String(year), label: String(year) });
    }
    return years;
  }, []);

  const monthOptions = useMemo(
    () =>
      months.map((name, index) => ({
        value: String(index + 1),
        label: name
      })),
    [months]
  );

  const setDateByParts = (year: number, monthIndex: number, day: number): void => {
    const safeDay = clampDay(year, monthIndex, day);
    const next = new Date(year, monthIndex, safeDay);
    setViewDate(next);
    onChange(formatIsoDate(next));
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="input flex items-center justify-between gap-3 text-left"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((previous) => !previous)}
      >
        <span className={selectedDate ? 'text-slate-900' : 'text-slate-400'}>{selectedDate ? formatDisplayDate(selectedDate) : placeholderText}</span>
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3.5" y="4.5" width="13" height="12" rx="2" />
          <path d="M6.5 2.9V6M13.5 2.9V6M3.5 7.5H16.5" strokeLinecap="round" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute z-20 mt-2 w-[340px] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl"
          role="dialog"
          aria-label={language === 'kaz' ? 'Күнтізбе' : 'Календарь'}
        >
          <div className="grid grid-cols-2 gap-2">
            <StyledSelect
              value={String(currentMonthIndex + 1)}
              placeholder={language === 'kaz' ? 'Ай' : 'Месяц'}
              options={monthOptions}
              onChange={(nextValue) => {
                const monthIndex = Number(nextValue) - 1;
                if (!Number.isNaN(monthIndex)) {
                  setDateByParts(currentYear, monthIndex, currentDay);
                }
              }}
            />
            <StyledSelect
              value={String(currentYear)}
              placeholder={language === 'kaz' ? 'Жыл' : 'Год'}
              options={yearOptions}
              onChange={(nextValue) => {
                const year = Number(nextValue);
                if (!Number.isNaN(year)) {
                  setDateByParts(year, currentMonthIndex, currentDay);
                }
              }}
            />
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
            {weekDays.map((day) => (
              <span key={day} className="py-1">
                {day}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarCells.map((cell) => {
              const isSelected = selectedDate ? isSameDay(cell.date, selectedDate) : false;
              const isToday = isSameDay(cell.date, new Date());

              return (
                <button
                  key={`${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`}
                  type="button"
                  className={`h-9 rounded-lg text-sm transition ${
                    isSelected
                      ? 'bg-brand-700 text-white hover:bg-brand-800'
                      : cell.inCurrentMonth
                        ? 'text-slate-800 hover:bg-slate-100'
                        : 'text-slate-400 hover:bg-slate-100'
                  } ${isToday && !isSelected ? 'ring-1 ring-brand-200' : ''}`}
                  onClick={() => {
                    setDateByParts(cell.date.getFullYear(), cell.date.getMonth(), cell.date.getDate());
                    setIsOpen(false);
                  }}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800"
              onClick={() => {
                const today = new Date();
                setDateByParts(today.getFullYear(), today.getMonth(), today.getDate());
                setIsOpen(false);
              }}
            >
              {language === 'kaz' ? 'Бүгін' : 'Сегодня'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
