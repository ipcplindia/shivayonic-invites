"use client";

/**
 * @author: @kokonutui
 * @description: A modern search bar component with action buttons and suggestions
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 *
 * ---------------------------------------------------------------------------
 * SHIVAYONIC ADAPTATION
 *
 * Source: https://kokonutui.com/r/action-search-bar.json, copied verbatim and
 * then changed only where the brief requires — structure, state machine,
 * debounce, keyboard handling, ARIA combobox wiring and the motion variants are
 * all the original component's.
 *
 * Changed:
 *  - the five demo actions ("Book tickets", "Talk to Jarvis", …) are gone; the
 *    component is now driven entirely by the `actions` prop.
 *  - selecting an action calls `onSelect` instead of parking the choice in
 *    local state, because in this application every action is a real
 *    destination. A command that highlighted and then did nothing would be a
 *    dead control.
 *  - Escape closes through `onDismiss` so the surrounding dialog can close too.
 *  - zinc/gray demo colours replaced with the Control Centre tokens.
 * ---------------------------------------------------------------------------
 */

import { Search, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useDebounce from "@/hooks/use-debounce";

export interface Action {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  short?: string;
  end?: string;
}

interface SearchResult {
  actions: Action[];
}

const ANIMATION_VARIANTS = {
  container: {
    hidden: { opacity: 0, height: 0 },
    show: {
      opacity: 1,
      height: "auto",
      transition: {
        height: { duration: 0.4 },
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        height: { duration: 0.3 },
        opacity: { duration: 0.2 },
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.2 },
    },
  },
} as const;

export function ActionSearchBar({
  actions,
  defaultOpen = false,
  autoFocus = false,
  label = "Search commands and destinations",
  placeholder = "Search commands and destinations…",
  emptyMessage = "No command or destination matches that search.",
  footnote,
  onSelect,
  onDismiss,
}: {
  actions: Action[];
  defaultOpen?: boolean;
  autoFocus?: boolean;
  label?: string;
  placeholder?: string;
  emptyMessage?: string;
  footnote?: string;
  onSelect: (action: Action) => void;
  onDismiss?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isFocused, setIsFocused] = useState(defaultOpen);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 200);

  const filteredActions = useMemo(() => {
    if (!debouncedQuery) return actions;

    const normalizedQuery = debouncedQuery.toLowerCase().trim();
    return actions.filter((action) => {
      const searchableText =
        `${action.label} ${action.description || ""} ${action.end || ""}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [debouncedQuery, actions]);

  useEffect(() => {
    if (!isFocused) {
      setResult(null);
      setActiveIndex(-1);
      return;
    }

    setResult({ actions: filteredActions });
    setActiveIndex(-1);
  }, [filteredActions, isFocused]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setActiveIndex(-1);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setIsFocused(false);
        setActiveIndex(-1);
        onDismiss?.();
        return;
      }
      if (!result?.actions.length) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) => (prev < result.actions.length - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : result.actions.length - 1));
          break;
        case "Enter": {
          e.preventDefault();
          const chosen = result.actions[activeIndex] ?? result.actions[0];
          if (chosen) onSelect(chosen);
          break;
        }
        default:
          break;
      }
    },
    [result?.actions, activeIndex, onSelect, onDismiss],
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setActiveIndex(-1);
  }, []);

  return (
    <div className="w-full">
      <div className="relative flex w-full flex-col items-stretch justify-start">
        <div className="w-full">
          <label
            className="mb-1 block font-medium text-[11px] text-muted-foreground uppercase tracking-[0.14em]"
            htmlFor="command-search"
          >
            {label}
          </label>
          <div className="relative">
            <input
              aria-activedescendant={
                activeIndex >= 0 ? `action-${result?.actions[activeIndex]?.id}` : undefined
              }
              aria-autocomplete="list"
              aria-controls="command-search-results"
              aria-expanded={isFocused && !!result}
              autoComplete="off"
              className="h-10 w-full rounded-lg border border-border bg-surface-sunken py-1.5 pr-9 pl-3 text-foreground text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              id="command-search"
              onChange={handleInputChange}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              ref={inputRef}
              role="combobox"
              type="text"
              value={query}
            />
            <div className="-translate-y-1/2 absolute top-1/2 right-3 h-4 w-4">
              <AnimatePresence mode="popLayout">
                {query.length > 0 ? (
                  <motion.div
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    initial={{ y: -20, opacity: 0 }}
                    key="send"
                    transition={{ duration: 0.2 }}
                  >
                    <Send className="h-4 w-4 text-muted-foreground" />
                  </motion.div>
                ) : (
                  <motion.div
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    initial={{ y: -20, opacity: 0 }}
                    key="search"
                    transition={{ duration: 0.2 }}
                  >
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="w-full">
          <AnimatePresence>
            {isFocused && result && (
              <motion.div
                animate="show"
                aria-label="Search results"
                className="mt-2 w-full overflow-hidden rounded-lg border border-border bg-popover"
                exit="exit"
                id="command-search-results"
                initial="hidden"
                role="listbox"
                variants={ANIMATION_VARIANTS.container}
              >
                {result.actions.length === 0 ? (
                  <p className="px-3 py-4 text-muted-foreground text-sm">{emptyMessage}</p>
                ) : (
                  <motion.ul className="max-h-[46vh] overflow-y-auto p-1" role="none">
                    {result.actions.map((action, index) => (
                      <motion.li
                        aria-selected={activeIndex === index}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-sidebar-accent ${
                          activeIndex === index ? "bg-sidebar-accent" : ""
                        }`}
                        id={`action-${action.id}`}
                        key={action.id}
                        layout
                        onClick={() => onSelect(action)}
                        onMouseEnter={() => setActiveIndex(index)}
                        role="option"
                        variants={ANIMATION_VARIANTS.item}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span aria-hidden="true" className="text-primary">
                            {action.icon}
                          </span>
                          <span className="truncate font-medium text-foreground text-sm">
                            {action.label}
                          </span>
                          {action.description && (
                            <span className="hidden text-muted-foreground text-xs sm:inline">
                              {action.description}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-none items-center gap-2">
                          {action.short && (
                            <span
                              aria-label={`Keyboard shortcut: ${action.short}`}
                              className="text-muted-foreground text-xs"
                            >
                              {action.short}
                            </span>
                          )}
                          {action.end && (
                            <span className="text-right text-muted-foreground text-xs uppercase tracking-[0.1em]">
                              {action.end}
                            </span>
                          )}
                        </div>
                      </motion.li>
                    ))}
                  </motion.ul>
                )}
                {footnote ? (
                  <div className="border-border border-t px-3 py-2">
                    <p className="text-muted-foreground text-xs">{footnote}</p>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default ActionSearchBar;
