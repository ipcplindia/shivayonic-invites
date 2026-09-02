import type { SVGProps } from "react";

/** A few public-site glyphs. Inline so the homepage adds no icon dependency. */
const paths: Record<string, string> = {
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM16.2 16.2 21 21",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "m6 6 12 12M18 6 6 18",
  arrow: "M5 12h14m0 0-5-5m5 5-5 5",
  play: "M8 5v14l11-7-11-7Z",
  chevronDown: "m6 9.5 6 6 6-6",
  check: "m5 12.5 4.5 4.5L19 7.5",
  youtube: "M3 8.5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-7Zm7 1.2v4.6l4-2.3-4-2.3Z",
  instagram: "M7 3.5h10A3.5 3.5 0 0 1 20.5 7v10a3.5 3.5 0 0 1-3.5 3.5H7A3.5 3.5 0 0 1 3.5 17V7A3.5 3.5 0 0 1 7 3.5Zm5 4.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm4.6-.8h.01",
  whatsapp: "M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.4-1.1A8.5 8.5 0 1 0 12 3.5Zm-3 5c.2 0 .4 0 .6.4l.8 1.7c.1.2 0 .4-.1.6l-.5.6c-.1.2-.2.3 0 .6a6 6 0 0 0 2.6 2.3c.3.1.4.1.6-.1l.6-.7c.2-.2.3-.2.6-.1l1.6.8c.3.1.4.3.4.5 0 .8-1.1 1.5-1.8 1.5-1.9 0-5.6-3.4-5.6-6 0-1 .8-1.9 1.6-2.4Z",
};

export function PIcon({ name, size = 20, ...rest }: SVGProps<SVGSVGElement> & { name: string; size?: number }) {
  const solid = name === "play" || name === "youtube" || name === "instagram" || name === "whatsapp";
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={solid ? "currentColor" : "none"}
      stroke={solid ? "none" : "currentColor"}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  );
}
