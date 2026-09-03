import { Icon } from "@/components/icon";
import styles from "@/components/shell/shell.module.css";
import { UserMenu } from "@/components/shell/user-menu";
import { IconButton } from "@/components/ui";
import { SidebarTrigger } from "@/components/ui-kit/sidebar";
import type { CurrentUserContext } from "@/shared/auth";

/**
 * Top command bar.
 *
 * The rail toggle is the shadcn `SidebarTrigger`, so one control collapses the
 * rail on a desktop and opens the sheet on a phone, and its state stays in sync
 * with the keyboard shortcut.
 *
 * Search is a real trigger for the command bar, and says exactly what it
 * searches. Notifications stay inert and labelled as such — there is no
 * notification service to read from.
 */
export function TopBar({
  context,
  pageTitle,
  onOpenCommandPalette,
}: {
  context: CurrentUserContext;
  pageTitle: string;
  onOpenCommandPalette?: () => void;
}) {
  return (
    <header className={styles.topbar}>
      <SidebarTrigger className={styles.railTrigger} />

      <nav aria-label="Breadcrumb" className={styles.crumbs}>
        <span className={styles.crumbAncestor}>Command Center</span>
        <Icon className={styles.crumbAncestor} name="chevronRight" size={13} />
        <span aria-current="page" className={styles.crumbCurrent}>
          {pageTitle}
        </span>
      </nav>

      <span className={styles.topbarSpacer} />

      <button
        aria-haspopup="dialog"
        className={styles.searchTrigger}
        onClick={onOpenCommandPalette}
        type="button"
      >
        <Icon className={styles.searchTriggerIcon} name="search" size={16} />
        <span className={styles.searchTriggerLabel}>Search commands and destinations…</span>
        <kbd className={styles.kbd}>Ctrl K</kbd>
      </button>

      <div className={styles.topbarTools}>
        <IconButton
          aria-haspopup="dialog"
          className={styles.searchIconTrigger}
          icon="search"
          label="Search commands and destinations"
          onClick={onOpenCommandPalette}
        />
        <IconButton
          disabled
          icon="bell"
          label="Notifications — not connected yet"
          title="Notifications arrive with the publishing pipeline."
        />
        <UserMenu context={context} />
      </div>
    </header>
  );
}

export { initials, roleLabel } from "@/components/shell/user-menu";
