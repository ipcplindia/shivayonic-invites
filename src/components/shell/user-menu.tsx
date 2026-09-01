"use client";

import { useState } from "react";
import Link from "next/link";

import { Icon } from "@/components/icon";
import styles from "@/components/shell/shell.module.css";
import { Badge, Button } from "@/components/ui";
import type { CurrentUserContext } from "@/shared/auth";

/**
 * Account menu.
 *
 * Sign-out is a real form POST to the existing `/api/auth/logout` route, which
 * clears the cookie server-side and 303s to `/login`. That keeps it working
 * without JavaScript and keeps the frontend away from session internals; the
 * only client state here is the pending flag on the button.
 *
 * Nothing else is offered: there is no profile-edit, account-switch or
 * organization-switch endpoint, so no such control is shown.
 */
export function UserMenu({ context }: { context: CurrentUserContext }) {
  const [signingOut, setSigningOut] = useState(false);

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
        <Link href="/admin/settings" className={styles.userPanelLink}>
          <Icon name="settings" size={16} />
          Settings
        </Link>
        <form
          method="post"
          action="/api/auth/logout"
          className={styles.logoutForm}
          onSubmit={() => setSigningOut(true)}
        >
          <Button
            type="submit"
            variant="ghost"
            icon="logout"
            className={styles.logoutButton}
            disabled={signingOut}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </Button>
        </form>
      </div>
    </details>
  );
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SY";
  const letters =
    parts.length === 1 ? parts[0].slice(0, 2) : `${parts[0][0]}${parts[parts.length - 1][0]}`;
  return letters.toUpperCase();
}

export function roleLabel(role: CurrentUserContext["role"]) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}
