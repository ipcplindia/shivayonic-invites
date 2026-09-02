export const memberRoles = ["OWNER", "ADMIN", "STAFF"] as const;
export type MemberRole = (typeof memberRoles)[number];

export const permissions = [
  "ORGANIZATION_MANAGE",
  "MEMBERS_MANAGE",
  "USERS_MANAGE",
  "INTEGRATIONS_MANAGE",
  "PROJECT_READ",
  "PROJECT_WRITE",
  "MEDIA_READ",
  "MEDIA_WRITE",
  "MEDIA_HARD_DELETE",
  "CONTENT_MANAGE",
  "CATALOGUE_MANAGE",
  "CUSTOMERS_VIEW",
  "ORDERS_MANAGE",
  "PUBLISH_CONTENT",
  "ANALYTICS_VIEW",
  "AUDIT_READ",
  "SECURITY_VIEW",
] as const;

export type Permission = (typeof permissions)[number];

export type UserSummary = {
  id: string;
  name: string;
  email: string;
};

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
};

export type CurrentUserContext = {
  user: UserSummary;
  organization: OrganizationSummary;
  role: MemberRole;
  permissions: Permission[];
};

export type AuthenticationError =
  | "AUTHENTICATION_REQUIRED"
  | "SESSION_EXPIRED"
  | "INVALID_CREDENTIALS";

export type AuthorizationError =
  | "ORGANIZATION_MEMBERSHIP_REQUIRED"
  | "PERMISSION_DENIED"
  | "ROLE_NOT_ALLOWED";
