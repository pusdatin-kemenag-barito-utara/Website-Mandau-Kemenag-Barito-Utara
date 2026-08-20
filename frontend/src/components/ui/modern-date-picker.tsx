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
} from "lucide-react";
import { m, AnimatePresence } from "framer-motion";

interface ModernDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  name?: string;
}

export function ModernDatePicker({
  value,
  onChange,
  label,
  required,
  name,
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
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/5">
      <button
        type="button"
        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 capitalize">
        {format(currentMonth, "MMMM yyyy", { locale: id })}
      </span>
      <button
        type="button"
        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
      >
        <ChevronRight className="h-4 w-4" />
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
            className={`text-[10px] font-extrabold uppercase text-center py-2 ${idx === 0 ? "text-red-500" : "text-slate-400 dark:text-slate-500"}`}
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
          <div
            key={currentDay.toString()}
            onClick={() => handleDateClick(currentDay)}
            className={`h-7 w-7 flex items-center justify-center text-[11px] font-bold rounded-lg cursor-pointer transition-all ${
              !isCurrentMonth
                ? "text-slate-200 dark:text-slate-700"
                : isSelected
                  ? "bg-[#059669] text-white shadow-md shadow-emerald-200 dark:shadow-none scale-105"
                  : isToday
                    ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500 font-extrabold"
                  : isSunday
                    ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 font-extrabold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-400"
            }`}
          >
            {format(currentDay, "d")}
          </div>,
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 mb-0.5 px-1 justify-items-center">
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
        <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
          {label}
        </label>
      )}
      <input type="hidden" name={name} value={value} required={required} />

      <button
        type="button"
        onClick={() => {
          if (!isOpen) {
            setCurrentMonth(value ? new Date(value) : new Date());
          }
          setIsOpen(!isOpen);
        }}
        className={`group flex items-center gap-3 w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border rounded-xl text-sm transition-all cursor-pointer ${
          isOpen
            ? "border-emerald-500 ring-2 ring-emerald-500/10"
            : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
        }`}
      >
        <CalendarIcon
          className={`h-4 w-4 transition-colors ${isOpen ? "text-emerald-500" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400"}`}
        />
        <span
          className={`flex-1 font-semibold text-left ${value ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}
        >
          {value
            ? format(new Date(value), "dd MMMM yyyy", { locale: id })
            : "Pilih Tanggal"}
        </span>
        {value && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="h-3 w-3 text-slate-400 dark:text-slate-500" />
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-[100] mt-1.5 w-64 bg-white dark:bg-[#1a1d24] rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden"
          >
            {renderHeader()}
            <div className="p-2">
              {renderDays()}
              {renderCells()}
              <div className="mt-2 p-2 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDateClick(new Date())}
                  className="px-3 py-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 rounded-lg transition-all"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/10 rounded-lg transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
