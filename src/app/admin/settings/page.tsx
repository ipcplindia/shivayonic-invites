import type { Metadata } from "next";
import type { ReactNode } from "react";

import styles from "@/app/admin/admin.module.css";
import { getCurrentUserContext } from "@/auth/context";
import { roleLabel } from "@/components/shell/top-bar";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  EmptyState,
  PageHeader,
} from "@/components/ui";
import { CopyValue } from "@/components/copy-value";
import { can } from "@/features/access";
import { permissions as allPermissions, type Permission } from "@/shared/auth";

export const metadata: Metadata = { title: "Settings" };

const permissionCopy: Record<Permission, string> = {
  ORGANIZATION_MANAGE: "Change organization settings and connected integrations.",
  MEMBERS_MANAGE: "Invite people, change their role, and remove access.",
  USERS_MANAGE: "Manage users and role assignments.",
  INTEGRATIONS_MANAGE: "Manage server-held service integrations.",
  PROJECT_READ: "Open projects and see the work attached to them.",
  PROJECT_WRITE: "Create and edit projects, and prepare them for publication.",
  MEDIA_READ: "Browse the media library and open master metadata.",
  MEDIA_WRITE: "Upload new masters and archive existing ones.",
  MEDIA_HARD_DELETE: "Permanently delete stored master files.",
  CONTENT_MANAGE: "Prepare website content and editorial records.",
  CATALOGUE_MANAGE: "Manage products, categories, styles and plans.",
  CUSTOMERS_VIEW: "View customer enquiries and submitted briefs.",
  ORDERS_MANAGE: "Manage the operational order pipeline.",
  PUBLISH_CONTENT: "Prepare and publish approved content.",
  ANALYTICS_VIEW: "View connected business and channel reporting.",
  AUDIT_READ: "Read the organization's audit record.",
  SECURITY_VIEW: "Review security sessions and events.",
};

export default async function SettingsPage() {
  const context = await getCurrentUserContext();
  const canManageOrganization = can(context, "ORGANIZATION_MANAGE");
  const canManageMembers = can(context, "MEMBERS_MANAGE");

  const permissionRows = allPermissions.map((permission) => ({
    permission,
    granted: context.permissions.includes(permission),
  }));

  return (
    <>
      <PageHeader
        title="Settings"
        lede="Your account, the organization, and the people who work in it."
      />

      <SettingsSection
        title="Account"
        body="How you appear to the rest of the studio. Identity is managed by the sign-in service."
      >
        <Card>
          <dl className={styles.definitionList}>
            <dt className={styles.definitionTerm}>Name</dt>
            <dd className={styles.definitionValue}>{context.user.name}</dd>
            <dt className={styles.definitionTerm}>Email</dt>
            <dd className={styles.definitionValue}>{context.user.email}</dd>
            <dt className={styles.definitionTerm}>Role</dt>
            <dd className={styles.definitionValue}>
              <Badge tone="brass">{roleLabel(context.role)}</Badge>
            </dd>
            <dt className={styles.definitionTerm}>Organization</dt>
            <dd className={styles.definitionValue}>
              {context.organization.name}{" "}
              <span className={styles.definitionSlug}>{context.organization.slug}</span>
              <CopyValue value={context.organization.slug} label="Organization identifier" />
            </dd>
          </dl>
        </Card>
      </SettingsSection>

      <SettingsSection
        title="Access"
        body="What your role allows in this organization. The interface hides what you cannot use; the server enforces it regardless."
      >
        <Card>
          <DataTable
            caption="Permissions granted to your role"
            rowKey={(row) => row.permission}
            rows={permissionRows}
            columns={[
              {
                key: "permission",
                header: "Permission",
                render: (row) => permissionCopy[row.permission],
              },
              {
                key: "granted",
                header: "Your role",
                render: (row) =>
                  row.granted ? (
                    <Badge tone="success">Granted</Badge>
                  ) : (
                    <Badge tone="neutral">Not granted</Badge>
                  ),
              },
            ]}
          />
        </Card>
      </SettingsSection>

      {canManageOrganization ? (
        <SettingsSection
          title="Organization"
          body="The studio's name, address on the web, and defaults for new work."
        >
          <Card>
            <CardHeader
              title={context.organization.name}
              description={`Identified as ${context.organization.slug}`}
              action={
                <Button
                  disabled
                  aria-disabled
                  title="Organization editing arrives with the organization API."
                >
                  Edit
                </Button>
              }
            />
            <EmptyState
              icon="settings"
              title="Organization editing is not available yet"
              body="No endpoint exists for changing organization details. Until one does, this section is read-only."
            />
          </Card>
        </SettingsSection>
      ) : null}

      {canManageMembers ? (
        <SettingsSection
          title="Team"
          body="Who can enter the Command Center, and what each of them may do."
        >
          <Card>
            <EmptyState
              icon="user"
              title="Member management is not exposed yet"
              body="Roles and memberships are enforced server-side today. A read and write endpoint is needed before the team can be managed from here."
            />
          </Card>
        </SettingsSection>
      ) : null}

      <SettingsSection
        title="Security"
        body="Sessions and sign-in are handled by the authentication service. Secrets are never shown in this interface."
      >
        <Card>
          <EmptyState
            icon="lock"
            title="Nothing to configure here yet"
            body="Password changes and session review are handled by the sign-in service. When those flows are exposed to the application, they appear in this section."
          />
        </Card>
      </SettingsSection>

      {canManageOrganization ? (
        <SettingsSection
          title="Integrations"
          body="Channels the studio publishes to, and the credentials that authorise them."
        >
          <Card>
            <EmptyState
              icon="publish"
              title="No integrations connected"
              body="Publishing providers will appear here as integrations become available. Credentials are stored server-side and are never returned to this interface."
            />
          </Card>
        </SettingsSection>
      ) : null}
    </>
  );
}

function SettingsSection({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.settingsSection} aria-labelledby={`settings-${title}`}>
      <div className={styles.settingsIntro}>
        <h2 className={styles.settingsTitle} id={`settings-${title}`}>
          {title}
        </h2>
        <p className={styles.settingsBody}>{body}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}
