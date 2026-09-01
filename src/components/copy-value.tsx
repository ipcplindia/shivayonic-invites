"use client";

import { IconButton } from "@/components/ui";
import { useToast } from "@/components/toast";

/**
 * Copies a non-sensitive value the operator may need to quote elsewhere — an
 * organization slug, an identifier shown on screen. Reports what actually
 * happened, including when the clipboard is unavailable.
 */
export function CopyValue({ value, label }: { value: string; label: string }) {
  const notify = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      notify("success", `${label} copied.`);
    } catch {
      notify("warning", `${label} could not be copied. Your browser blocked clipboard access.`);
    }
  }

  return <IconButton icon="check" label={`Copy ${label.toLowerCase()}`} onClick={copy} />;
}
