import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * The class-merging helper the imported shadcn and KokonutUI components expect
 * at this exact path. Kept verbatim so those components need no edit to their
 * own class logic.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
