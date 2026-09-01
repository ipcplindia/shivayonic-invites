import { Icon } from "@/components/icon";
import styles from "@/components/shell/shell.module.css";
import { UserMenu } from "@/components/shell/user-menu";
import { IconButton } from "@/components/ui";
import type { CurrentUserContext } from "@/shared/auth";

/**
 * Top command bar.
 *
 * Search is a real trigger for the command palette, and says exactly what it
 * searches. Notifications stay inert and labelled as such — there is no
 * notification service to read from.
 */
export function TopBar({
  context,
  pageTitle,
  navId,
  menuOpen = false,
  onToggleMenu,
  onOpenCommandPalette,
}: {
  context: CurrentUserContext;
  pageTitle: string;
  navId?: string;
  menuOpen?: boolean;
  onToggleMenu?: () => void;
  onOpenCommandPalette?: () => void;
}) {
  return (
    <header className={styles.topbar}>
      <IconButton
        icon={menuOpen ? "close" : "menu"}
        label={menuOpen ? "Close navigation" : "Open navigation"}
        className={styles.menuButton}
        aria-expanded={menuOpen}
        aria-controls={navId}
        onClick={onToggleMenu}
      />

      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <span className={styles.crumbAncestor}>Command Center</span>
        <Icon name="chevronRight" size={13} className={styles.crumbAncestor} />
        <span className={styles.crumbCurrent} aria-current="page">
          {pageTitle}
        </span>
      </nav>

      <span className={styles.topbarSpacer} />

      <button
        type="button"
        className={styles.searchTrigger}
        onClick={onOpenCommandPalette}
        aria-haspopup="dialog"
      >
        <Icon name="search" size={16} className={styles.searchTriggerIcon} />
        <span className={styles.searchTriggerLabel}>Search commands and destinations…</span>
        <kbd className={styles.kbd}>Ctrl K</kbd>
      </button>

      <div className={styles.topbarTools}>
        <IconButton
          icon="search"
          label="Search commands and destinations"
          className={styles.searchIconTrigger}
          onClick={onOpenCommandPalette}
          aria-haspopup="dialog"
        />
        <IconButton
          icon="bell"
          label="Notifications — not connected yet"
          disabled
          title="Notifications arrive with the publishing pipeline."
        />
        <UserMenu context={context} />
      </div>
    </header>
  );
}

export { initials, roleLabel } from "@/components/shell/user-menu";
