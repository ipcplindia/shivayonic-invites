import { Icon } from "@/components/icon";
import styles from "@/components/shell/shell.module.css";
import { Badge, Button, IconButton, SearchInput } from "@/components/ui";
import type { CurrentUserContext } from "@/shared/auth";

/**
 * Top command bar. Search and notifications are present as inert affordances
 * (disabled, and labelled as such) rather than as controls that pretend to work.
 */
export function TopBar({
  context,
  pageTitle,
  navId,
  menuOpen = false,
  onToggleMenu,
}: {
  context: CurrentUserContext;
  pageTitle: string;
  navId?: string;
  menuOpen?: boolean;
  onToggleMenu?: () => void;
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

      <div className={styles.topbarSearch}>
        <SearchInput
          label="Search the Command Center"
          placeholder="Search is not connected yet"
          disabled
          title="Global search arrives with the search service."
        />
      </div>

      <div className={styles.topbarTools}>
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

function UserMenu({ context }: { context: CurrentUserContext }) {
  return (
    <details className={styles.userMenu}>
      <summary className={styles.userTrigger} aria-label={`Account menu for ${context.user.name}`}>
        <span className={styles.avatar} aria-hidden="true">
          {initials(context.user.name)}
        </span>
        <span className={styles.userIdentity}>
          <span className={styles.userName}>{context.user.name}</span>
          <span className={styles.userRole}>{roleLabel(context.role)}</span>
        </span>
        <Icon name="chevronDown" size={14} />
      </summary>

      <div className={styles.userPanel}>
        <p className={styles.userPanelEmail}>{context.user.email}</p>
        <hr className={styles.userPanelDivider} />
        <div className={styles.userPanelRow}>
          <span>Organization</span>
          <strong>{context.organization.name}</strong>
        </div>
        <div className={styles.userPanelRow}>
          <span>Role</span>
          <Badge tone="brass">{roleLabel(context.role)}</Badge>
        </div>
        <hr className={styles.userPanelDivider} />
        <form method="post" action="/api/auth/logout" className={styles.logoutForm}>
          <Button type="submit" variant="ghost" icon="logout" className={styles.logoutButton}>
            Sign out
          </Button>
        </form>
      </div>
    </details>
  );
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SY";
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : `${parts[0][0]}${parts[parts.length - 1][0]}`;
  return letters.toUpperCase();
}

export function roleLabel(role: CurrentUserContext["role"]) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}
