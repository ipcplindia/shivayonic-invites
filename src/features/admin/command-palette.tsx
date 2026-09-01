"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Icon, type IconName } from "@/components/icon";
import { overlayStyles as styles, useModalDialog } from "@/components/overlay";
import { visibleNavGroups } from "@/features/admin/navigation";
import type { CurrentUserContext } from "@/shared/auth";

export type Command = {
  id: string;
  label: string;
  group: string;
  icon: IconName;
  hint?: string;
  href: string;
};

/**
 * The palette knows exactly what this client knows: the destinations the
 * operator is permitted to open. Extracted so the command set can be asserted
 * without mounting a router.
 */
export function commandsFor(context: CurrentUserContext): Command[] {
  return visibleNavGroups(context).flatMap((group) =>
    group.items.map((item) => ({
      id: `go:${item.href}`,
      label: item.label,
      group: "Go to",
      icon: item.icon,
      hint: item.pending ? "Soon" : undefined,
      href: item.href,
    })),
  );
}

export function filterCommands(commands: Command[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return commands;
  return commands.filter((command) =>
    `${command.group} ${command.label}`.toLowerCase().includes(needle),
  );
}

/**
 * Command palette.
 *
 * Scope is deliberately narrow and honestly labelled: it searches the
 * destinations and frontend actions this client already knows about. There is
 * no global search API, so it does not claim to search media, projects or
 * customers.
 */
export function CommandPalette({
  context,
  open,
  onClose,
  onNavigate,
}: {
  context: CurrentUserContext;
  open: boolean;
  onClose: () => void;
  onNavigate: (href: string) => void;
}) {
  const { ref, onDialogClose } = useModalDialog(open, onClose);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const commands = useMemo(() => commandsFor(context), [context]);
  const matches = useMemo(() => filterCommands(commands, query), [commands, query]);

  // Reset on each opening so the palette never reopens mid-search.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function activate(command: Command | undefined) {
    if (!command) return;
    onClose();
    onNavigate(command.href);
  }

  function onKeyDown(event: { key: string; preventDefault: () => void }) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (matches.length ? (index + 1) % matches.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (matches.length ? (index - 1 + matches.length) % matches.length : 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      activate(matches[activeIndex]);
    }
    // Escape is handled natively by <dialog>.
  }

  let lastGroup = "";

  return (
    <dialog
      ref={ref}
      className={styles.palette}
      aria-label="Command palette"
      onClose={onDialogClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.paletteSearch}>
        <Icon name="search" size={17} />
        <input
          ref={inputRef}
          className={styles.paletteInput}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search commands and destinations…"
          aria-label="Search commands and destinations"
          aria-controls="command-palette-results"
          autoComplete="off"
        />
      </div>

      {matches.length === 0 ? (
        <p className={styles.paletteEmpty}>No command or destination matches “{query}”.</p>
      ) : (
        <ul className={styles.paletteList} id="command-palette-results">
          {matches.map((command, index) => {
            const showGroup = command.group !== lastGroup;
            lastGroup = command.group;
            return (
              <li key={command.id}>
                {showGroup ? <p className={styles.paletteGroup}>{command.group}</p> : null}
                <button
                  type="button"
                  className={styles.paletteItem}
                  data-active={index === activeIndex ? "true" : "false"}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => activate(command)}
                >
                  <Icon name={command.icon} size={16} className={styles.paletteIcon} />
                  <span className={styles.paletteLabel}>{command.label}</span>
                  {command.hint ? <span className={styles.paletteHint}>{command.hint}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className={styles.paletteFooter}>
        Searches this workspace&rsquo;s destinations and actions. Searching media and projects
        arrives with their APIs.
      </p>
    </dialog>
  );
}
