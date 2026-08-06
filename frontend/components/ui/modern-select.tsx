"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Search, X, LucideIcon } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";

interface ModernSelectOption {
  value: string;
  label: string;
}

interface ModernSelectProps {
  options: string[] | ModernSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  icon?: LucideIcon;
  enableSearch?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
}

export function ModernSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih opsi...",
  searchPlaceholder = "Cari...",
  icon: Icon,
  enableSearch = false,
  required,
  name,
  id,
}: ModernSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isMobile = useCallback(() => {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        typeof navigator !== "undefined" ? navigator.userAgent : "",
      ) || (typeof window !== "undefined" && window.innerWidth < 768)
    );
  }, []);

  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "string") {
      return { value: opt, label: opt };
    }
    return opt;
  });

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

  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleOpen = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen && enableSearch && !isMobile()) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef} id={id}>
      <input type="hidden" name={name} value={value} required={required} />

      <button
        type="button"
        onClick={handleOpen}
        className={`group flex items-center gap-3 w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border rounded-xl text-sm transition-all cursor-pointer ${
          isOpen
            ? "border-emerald-500 ring-2 ring-emerald-500/10"
            : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
        }`}
      >
        {Icon && (
          <Icon
            className={`h-4 w-4 shrink-0 transition-colors ${
              isOpen
                ? "text-emerald-500"
                : "text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400"
            }`}
          />
        )}
        <span
          className={`flex-1 text-left truncate font-semibold ${
            value ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-300 ${
            isOpen ? "text-emerald-500 rotate-180" : "group-hover:text-slate-500 dark:group-hover:text-slate-400"
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-[100] mt-2 w-full bg-white dark:bg-[#1a1d24] rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden"
          >
            {enableSearch && (
              <div className="p-2 border-b border-slate-100 dark:border-white/5 flex items-center gap-2 bg-slate-50/50 dark:bg-white/5">
                <Search className="h-4 w-4 text-slate-400 dark:text-slate-500 ml-2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  inputMode={isMobile() ? "none" : "text"}
                  readOnly={isMobile()}
                  value={searchQuery}
                  onChange={(e) => !isMobile() && setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent border-0 px-2 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-0"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors mr-1"
                  >
                    <X className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                  </button>
                )}
              </div>
            )}

            <div className="max-h-72 overflow-y-auto p-2 pb-6 pr-3 space-y-0.5 custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full text-left px-3 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100 dark:shadow-none"
                          : "text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-400"
                      }`}
                    >
                      <span className="truncate pr-4">{opt.label}</span>
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-xs font-semibold text-slate-400 dark:text-slate-500 text-center">
                  Opsi tidak ditemukan
                </div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
