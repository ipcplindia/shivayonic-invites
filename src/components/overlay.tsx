"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { Button, IconButton } from "@/components/ui";
import styles from "@/components/overlay.module.css";

/**
 * Every modal surface in the Command Center is a native `<dialog>` opened with
 * `showModal()`. The platform then owns focus trapping, Escape, inertness of
 * the page behind, top-layer stacking (so nothing can clip us), and returning
 * focus to whatever opened the dialog. That is far less code — and far more
 * correct — than a hand-rolled trap.
 */
function useModalDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // The page behind a modal must not scroll on touch devices.
  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [open]);

  // Fires for Escape and for programmatic close alike.
  const onDialogClose = () => {
    if (open) onClose();
  };

  return { ref, onDialogClose };
}

/** Closes when the click lands on the backdrop rather than on the panel. */
function backdropClose(onClose: () => void) {
  return (event: { target: EventTarget | null; currentTarget: EventTarget | null }) => {
    if (event.target === event.currentTarget) onClose();
  };
}

/* ------------------------------------------------------------------ Dialog */

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  dismissible?: boolean;
}) {
  const { ref, onDialogClose } = useModalDialog(open, onClose);
  const titleId = `dialog-title-${title.replace(/\W+/g, "-").toLowerCase()}`;

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onClose={onDialogClose}
      onCancel={(event) => {
        if (!dismissible) event.preventDefault();
      }}
      onClick={dismissible ? backdropClose(onClose) : undefined}
    >
      <header className={styles.dialogHeader}>
        <div>
          <h2 className={styles.dialogTitle} id={titleId}>
            {title}
          </h2>
          {description ? <p className={styles.dialogDescription}>{description}</p> : null}
        </div>
        {dismissible ? <IconButton icon="close" label="Close" onClick={onClose} /> : null}
      </header>
      {children ? <div className={styles.dialogBody}>{children}</div> : null}
      {footer ? <div className={styles.dialogFooter}>{footer}</div> : null}
    </dialog>
  );
}

/**
 * Confirmation shell for destructive work. No destructive action is wired to it
 * yet — it exists so that when one is, the pattern is already decided.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "danger",
  pending = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  pending?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant={tone} onClick={onConfirm} disabled={pending}>
            {pending ? "Working…" : confirmLabel}
          </Button>
        </>
      }
    />
  );
}

/* --------------------------------------------------------------- Inspector */

/**
 * Right-side inspector. Desktop: a panel against the right edge. Below 640px it
 * becomes a full-width sheet. Same dialog semantics as above.
 */
export function Inspector({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { ref, onDialogClose } = useModalDialog(open, onClose);
  const titleId = "inspector-title";

  return (
    <dialog
      ref={ref}
      className={styles.drawer}
      aria-labelledby={titleId}
      onClose={onDialogClose}
      onClick={backdropClose(onClose)}
    >
      <header className={styles.dialogHeader}>
        <div>
          <h2 className={styles.dialogTitle} id={titleId}>
            {title}
          </h2>
          {description ? <p className={styles.dialogDescription}>{description}</p> : null}
        </div>
        <IconButton icon="close" label="Close inspector" onClick={onClose} />
      </header>
      <div className={styles.drawerBody}>{children}</div>
      {footer ? <div className={styles.drawerFooter}>{footer}</div> : null}
    </dialog>
  );
}

export { useModalDialog, styles as overlayStyles };
