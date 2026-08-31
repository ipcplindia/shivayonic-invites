import Link from "next/link";

import { Icon } from "@/components/icon";
import styles from "@/components/shell/shell.module.css";
import { activeNavItem, visibleNavGroups } from "@/features/admin/navigation";
import type { CurrentUserContext } from "@/shared/auth";

/**
 * The navigation rail. Pure and prop-driven: the shell owns pathname and drawer
 * state, so this component can be rendered and asserted on directly.
 */
export function Sidebar({
  context,
  pathname,
  open = false,
  navId,
  onNavigate,
}: {
  context: CurrentUserContext;
  pathname: string;
  open?: boolean;
  navId?: string;
  onNavigate?: () => void;
}) {
  const groups = visibleNavGroups(context);
  const active = activeNavItem(pathname);

  return (
    <div
      id={navId}
      className={styles.rail}
      data-open={open ? "true" : "false"}
    >
      <Link href="/admin" className={styles.brand} onClick={onNavigate}>
        <BrandMark />
        <span className={styles.brandText}>
          <span className={styles.brandName}>SHIVAYONIC</span>
          <span className={styles.brandDescriptor}>Command Center</span>
        </span>
      </Link>

      <nav className={styles.nav} aria-label="Command Center sections">
        {groups.map((group) => (
          <div key={group.label} className={styles.navGroup}>
            <p className={styles.navGroupLabel} id={`nav-group-${group.label}`}>
              {group.label}
            </p>
            <ul className={styles.navList} aria-labelledby={`nav-group-${group.label}`}>
              {group.items.map((item) => {
                const isActive = active?.href === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={item.label}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={
                        isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
                      }
                    >
                      <Icon name={item.icon} size={18} className={styles.navIcon} />
                      <span className={styles.navLabel}>{item.label}</span>
                      {item.pending ? <span className={styles.navPending}>Soon</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={styles.railFooter}>
        <p className={styles.orgName}>{context.organization.name}</p>
        <p className={styles.orgMeta}>{context.organization.slug}</p>
      </div>
    </div>
  );
}

/**
 * Brand mark: an aperture blade over a struck string. Cinema and music, drawn
 * once, in brass.
 */
function BrandMark() {
  return (
    <svg
      className={styles.brandMark}
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M13 2.4 22.4 13 13 23.6 3.6 13 13 2.4Z" />
      <path d="M13 7.6 18.4 13 13 18.4 7.6 13 13 7.6Z" opacity="0.55" />
      <path d="M13 2.4v21.2" strokeWidth="0.9" opacity="0.5" />
    </svg>
  );
}
