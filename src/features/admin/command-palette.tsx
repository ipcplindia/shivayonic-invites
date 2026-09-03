"use client";

import { Icon, type IconName } from "@/components/icon";
import { ActionSearchBar, type Action } from "@/components/kokonutui/action-search-bar";
import { overlayStyles as styles, useModalDialog } from "@/components/overlay";
import { quickActionsFor } from "@/features/admin/actions";
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
 * The palette knows exactly what this client knows: the actions the operator
 * can complete today, and the destinations they are permitted to open.
 * Extracted so the command set can be asserted without mounting a router.
 */
export function commandsFor(context: CurrentUserContext): Command[] {
  return [
    ...quickActionsFor(context).map((action) => ({
      id: `do:${action.label}`,
      label: action.label,
      group: "Actions",
      icon: action.icon,
      hint: action.hint,
      href: action.href,
    })),
    ...visibleNavGroups(context).flatMap((group) =>
      group.items.map((item) => ({
        id: `go:${item.href}`,
        label: item.label,
        group: "Go to",
        icon: item.icon,
        hint: item.pending ? "Soon" : undefined,
        href: item.href,
      })),
    ),
  ];
}

export function filterCommands(commands: Command[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return commands;
  return commands.filter((command) =>
    `${command.group} ${command.label}`.toLowerCase().includes(needle),
  );
}

/**
 * Command bar.
 *
 * The search surface itself is KokonutUI's action-search-bar; this component
 * supplies the real command set, performs the navigation, and keeps the whole
 * thing inside a native <dialog> so focus trapping and Escape stay the
 * platform's job rather than a reimplementation.
 *
 * Scope is honestly labelled: it searches destinations and the actions this
 * deployment can actually perform. There is no global search API, so it does
 * not claim to search media, projects or customers.
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

  const commands = commandsFor(context);
  const actions: Action[] = commands.map((command) => ({
    id: command.id,
    label: command.label,
    icon: <Icon name={command.icon} size={16} />,
    description: command.group === "Actions" ? undefined : command.hint,
    end: command.group === "Actions" ? command.hint : undefined,
  }));

  const hrefById = new Map(commands.map((command) => [command.id, command.href]));

  return (
    <dialog
      aria-label="Command palette"
      className={styles.palette}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onClose={onDialogClose}
      ref={ref}
    >
      <div className="cc-scope dark p-4">
        <ActionSearchBar
          actions={actions}
          autoFocus={open}
          defaultOpen
          onDismiss={onClose}
          onSelect={(action) => {
            const href = hrefById.get(action.id);
            if (!href) return;
            onClose();
            onNavigate(href);
          }}
        />
        {/*
          The scope note lives outside the results panel so it is readable
          whether or not a search is in progress.
        */}
        <p className="mt-3 text-muted-foreground text-xs">
          Searches this workspace&rsquo;s destinations and actions it can perform today. Searching
          media and projects arrives with their APIs.
        </p>
      </div>
    </dialog>
  );
}
