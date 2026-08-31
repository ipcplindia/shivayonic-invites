import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

import { Icon, type IconName } from "@/components/icon";
import styles from "@/components/ui.module.css";

/**
 * Command Center primitives. Every one of these is a server component by
 * default; interactivity is added by the feature that needs it, not here.
 */

function cx(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ Button */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  icon?: IconName;
};

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        styles.button,
        styles[variant],
        size === "sm" && styles.sizeSm,
        size === "lg" && styles.sizeLg,
        className,
      )}
      {...rest}
    >
      {icon ? <Icon name={icon} size={size === "sm" ? 14 : 16} /> : null}
      {children}
    </button>
  );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName;
  label: string;
};

export function IconButton({ icon, label, className, type = "button", ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(styles.button, styles.iconButton, className)}
      {...rest}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}

/* -------------------------------------------------------------------- Card */

export function Card({
  children,
  className,
  as: As = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "article" | "div";
}) {
  return <As className={cx(styles.card, className)}>{children}</As>;
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className={styles.cardHeader}>
      <div className={styles.cardHeaderText}>
        <h3 className={styles.cardTitle}>{title}</h3>
        {description ? <p className={styles.cardDescription}>{description}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx(styles.cardBody, className)}>{children}</div>;
}

/* ------------------------------------------------------------------- Badge */

type BadgeTone = "neutral" | "brass" | "signal" | "success" | "warning" | "danger";

const badgeToneClass: Record<BadgeTone, string | undefined> = {
  neutral: undefined,
  brass: styles.badgeBrass,
  signal: styles.badgeSignal,
  success: styles.badgeSuccess,
  warning: styles.badgeWarning,
  danger: styles.badgeDanger,
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return <span className={cx(styles.badge, badgeToneClass[tone])}>{children}</span>;
}

/**
 * Status is expressed by tone *and* by dot shape, so the state is still legible
 * to a colour-blind operator or on a projector.
 */
export type StatusShape = "solid" | "hollow" | "square";

export function StatusBadge({
  label,
  tone = "neutral",
  shape = "solid",
}: {
  label: string;
  tone?: BadgeTone;
  shape?: StatusShape;
}) {
  return (
    <span className={cx(styles.badge, badgeToneClass[tone])}>
      <span
        className={cx(
          styles.statusDot,
          shape === "hollow" && styles.statusDotHollow,
          shape === "square" && styles.statusDotSquare,
        )}
      />
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ Fields */

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  hideLabel?: boolean;
};

export function Input({ label, hint, hideLabel, id, className, ...rest }: InputProps) {
  const inputId = id ?? `field-${label.replace(/\W+/g, "-").toLowerCase()}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId} hidden={hideLabel}>
        {label}
      </label>
      <input
        id={inputId}
        aria-describedby={hintId}
        className={cx(styles.control, className)}
        {...rest}
      />
      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SearchInput({
  label,
  className,
  id,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const inputId = id ?? `search-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <span className={styles.searchWrap}>
      <label className={styles.label} htmlFor={inputId} hidden>
        {label}
      </label>
      <Icon name="search" size={16} className={styles.searchIcon} />
      <input
        id={inputId}
        type="search"
        className={cx(styles.control, styles.searchInput, className)}
        {...rest}
      />
    </span>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hideLabel?: boolean;
  options: Array<{ value: string; label: string }>;
};

export function Select({ label, hideLabel, options, id, className, ...rest }: SelectProps) {
  const selectId = id ?? `select-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={selectId} hidden={hideLabel}>
        {label}
      </label>
      <span className={styles.selectWrap}>
        <select id={selectId} className={cx(styles.control, styles.select, className)} {...rest}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon name="chevronDown" size={16} className={styles.selectChevron} />
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ States */

export function EmptyState({
  icon = "inbox",
  title,
  body,
  action,
}: {
  icon?: IconName;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.state}>
      <span className={styles.stateGlyph}>
        <Icon name={icon} size={20} />
      </span>
      <h3 className={styles.stateTitle}>{title}</h3>
      <p className={styles.stateBody}>{body}</p>
      {action ? <div className={styles.stateActions}>{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.state} role="alert">
      <span className={cx(styles.stateGlyph, styles.stateGlyphDanger)}>
        <Icon name="alert" size={20} />
      </span>
      <h3 className={styles.stateTitle}>{title}</h3>
      <p className={styles.stateBody}>{body}</p>
      {action ? <div className={styles.stateActions}>{action}</div> : null}
    </div>
  );
}

export function Skeleton({
  width = "100%",
  height = 14,
  radius,
}: {
  width?: string | number;
  height?: string | number;
  radius?: string;
}) {
  return (
    <span
      className={styles.skeleton}
      style={{ display: "block", width, height, borderRadius: radius }}
    />
  );
}

/* ------------------------------------------------------------------- Table */

export type Column<Row> = {
  key: string;
  header: string;
  numeric?: boolean;
  render: (row: Row) => ReactNode;
};

export function DataTable<Row>({
  caption,
  columns,
  rows,
  rowKey,
}: {
  caption: string;
  columns: Array<Column<Row>>;
  rows: Row[];
  rowKey: (row: Row) => string;
}) {
  return (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <caption hidden>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} className={column.numeric ? styles.numeric : undefined}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ Layout */

export function PageHeader({
  title,
  lede,
  actions,
}: {
  title: string;
  lede?: string;
  actions?: ReactNode;
}) {
  return (
    <header className={styles.pageHeader}>
      <div className={styles.pageHeaderText}>
        <h1 className={styles.pageTitle}>{title}</h1>
        {lede ? <p className={styles.pageLede}>{lede}</p> : null}
      </div>
      {actions ? <div className={styles.pageHeaderActions}>{actions}</div> : null}
    </header>
  );
}

export function SectionHeader({ title, meta }: { title: string; meta?: ReactNode }) {
  return (
    <div className={styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {meta ? <span className={styles.sectionMeta}>{meta}</span> : null}
    </div>
  );
}

export function BrassRule() {
  return <hr className={styles.brassRule} />;
}
