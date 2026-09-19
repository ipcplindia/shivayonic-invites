import "server-only";
import { bootstrapOwner } from "@/auth/bootstrap-owner";

const state = globalThis as typeof globalThis & { previewBaseline?: Promise<void> };

/** Preview deployments get their isolated tenant baseline lazily; every other environment is inert. */
export async function ensurePreviewBaseline() {
  if (process.env.VERCEL_ENV !== "preview") return;
  state.previewBaseline ??= bootstrapOwner().then(() => undefined).catch((error) => {
    state.previewBaseline = undefined;
    throw error;
  });
  await state.previewBaseline;
}
