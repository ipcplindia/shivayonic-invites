"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { Icon, type IconName } from "@/components/icon";
import styles from "@/components/overlay.module.css";

export type ToastTone = "success" | "info" | "warning" | "error";

type Toast = { id: number; tone: ToastTone; message: string };

const toneIcon: Record<ToastTone, IconName> = {
  success: "check",
  info: "inbox",
  warning: "alert",
  error: "alert",
};

const toneClass: Record<ToastTone, string | undefined> = {
  success: styles.toastSuccess,
  info: undefined,
  warning: styles.toastWarning,
  error: styles.toastError,
};

const toneIconClass: Record<ToastTone, string> = {
  success: styles.toastIconSuccess,
  info: styles.toastIconInfo,
  warning: styles.toastIconWarning,
  error: styles.toastIconError,
};

const ToastContext = createContext<((tone: ToastTone, message: string) => void) | null>(null);

/**
 * Small in-app feedback channel. Deliberately not a dependency: four tones, a
 * live region, auto-dismiss for the non-critical ones, and nothing else.
 *
 * Toasts report what actually happened. Nothing here reports success for work
 * the backend has not done.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (tone: ToastTone, message: string) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current.slice(-2), { id, tone, message }]);
      // Errors stay until dismissed; the rest clear themselves.
      if (tone !== "error") {
        setTimeout(() => dismiss(id), 5000);
      }
    },
    [dismiss],
  );

  const value = useMemo(() => notify, [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={styles.toastRegion}
        role="status"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className={`${styles.toast} ${toneClass[toast.tone] ?? ""}`}>
            <Icon name={toneIcon[toast.tone]} size={16} className={toneIconClass[toast.tone]} />
            <span className={styles.toastText}>{toast.message}</span>
            <button
              type="button"
              className={styles.toastDismiss}
              aria-label="Dismiss notification"
              onClick={() => dismiss(toast.id)}
            >
              <Icon name="close" size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** No-ops outside a provider so a component is never coupled to one. */
export function useToast() {
  const notify = useContext(ToastContext);
  return notify ?? (() => {});
}
