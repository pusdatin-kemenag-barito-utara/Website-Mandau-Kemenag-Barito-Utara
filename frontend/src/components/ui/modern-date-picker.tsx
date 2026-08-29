import React, { useState, useRef, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  getDay,
} from "date-fns";
import { id } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
  RotateCcw,
} from "lucide-react";
import { m, AnimatePresence } from "framer-motion";

interface ModernDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  name?: string;
  placeholder?: string;
}

export function ModernDatePicker({
  value,
  onChange,
  label,
  required,
  name,
  placeholder = "Pilih Tanggal",
}: ModernDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    value ? new Date(value) : new Date(),
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedDate = value ? new Date(value) : null;

  const handleDateClick = (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    onChange(formattedDate);
    setIsOpen(false);
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between px-2 py-1 mb-2 border-b border-slate-100 dark:border-white/5 pb-3">
      <button
        type="button"
        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        aria-label="Bulan sebelumnya"
        className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors text-slate-600 dark:text-slate-300 cursor-pointer active:scale-95"
      >
        <ChevronLeft className="h-4.5 w-4.5" />
      </button>
      <span className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 capitalize tracking-tight">
        {format(currentMonth, "MMMM yyyy", { locale: id })}
      </span>
      <button
        type="button"
        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        aria-label="Bulan berikutnya"
        className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors text-slate-600 dark:text-slate-300 cursor-pointer active:scale-95"
      >
        <ChevronRight className="h-4.5 w-4.5" />
      </button>
    </div>
  );

  const renderDays = () => {
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day, idx) => (
          <div
            key={day}
            className={`text-xs font-extrabold uppercase text-center py-1.5 tracking-wider ${
              idx === 0 ? "text-rose-500 dark:text-rose-400" : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const today = new Date();

    const rows: React.ReactNode[] = [];
    let days: React.ReactNode[] = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const isSelected =
          selectedDate && isSameDay(currentDay, selectedDate);
        const isCurrentMonth = isSameMonth(currentDay, monthStart);
        const isSunday = getDay(currentDay) === 0;
        const isToday = isSameDay(currentDay, today);

        days.push(
          <button
            key={currentDay.toString()}
            type="button"
            onClick={() => handleDateClick(currentDay)}
            className={`h-8 w-8 min-[380px]:h-9 min-[380px]:w-9 sm:h-10 sm:w-10 flex items-center justify-center text-xs sm:text-sm font-bold rounded-xl cursor-pointer transition-all duration-150 ${
              !isCurrentMonth
                ? "text-slate-300 dark:text-slate-700 hover:text-slate-400 dark:hover:text-slate-600"
                : isSelected
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-105 font-extrabold ring-2 ring-emerald-400/40"
                  : isToday
                    ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/40 font-extrabold"
                    : isSunday
                      ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 font-extrabold"
                      : "text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400"
            }`}
          >
            {format(currentDay, "d")}
          </button>,
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 justify-items-center">
          {days}
        </div>,
      );
      days = [];
    }
    return <div className="pb-1">{rows}</div>;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <input type="hidden" id={name} name={name} value={value} required={required} />

      <button
        type="button"
        onClick={() => {
          if (!isOpen) {
            setCurrentMonth(value ? new Date(value) : new Date());
          }
          setIsOpen(!isOpen);
        }}
        className={`group relative flex items-center gap-2.5 sm:gap-3 w-full h-11 sm:h-12 px-3.5 sm:px-4 bg-white dark:bg-slate-900/60 border rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer ${
          isOpen
            ? "border-emerald-500 ring-4 ring-emerald-500/10 dark:ring-emerald-500/20"
            : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
        }`}
      >
        <CalendarIcon
          className={`h-4.5 w-4.5 shrink-0 transition-colors ${
            isOpen
              ? "text-emerald-500"
              : "text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
          }`}
        />
        <span
          className={`flex-1 text-left truncate ${
            value ? "text-slate-900 dark:text-slate-100 font-bold" : "text-slate-400 dark:text-slate-500"
          }`}
        >
          {value
            ? format(new Date(value), "dd MMMM yyyy", { locale: id })
            : placeholder}
        </span>
        {value && (
          <div
            role="button"
            aria-label="Hapus tanggal"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-rose-500"
          >
            <X className="h-3.5 w-3.5" />
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-0 right-0 sm:right-auto z-[120] mt-2 w-full sm:w-[330px] max-w-[340px] mx-auto sm:mx-0 bg-white/98 dark:bg-[#121620]/98 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl shadow-slate-900/30 dark:shadow-black/80 border border-slate-200/90 dark:border-white/10 p-2.5 sm:p-4 overflow-hidden"
          >
            {renderHeader()}
            <div>
              {renderDays()}
              {renderCells()}
              <div className="mt-2.5 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleDateClick(new Date())}
                  className="px-3 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  Hari Ini
                </button>
                <div className="flex items-center gap-1.5">
                  {value && (
                    <button
                      type="button"
                      onClick={() => {
                        onChange("");
                        setIsOpen(false);
                      }}
                      className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded-xl transition-all cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

