import type { SVGProps } from "react";

/**
 * One icon vocabulary for the whole Command Center: 24px grid, 1.5px stroke,
 * round joins. Inline paths rather than an icon package so the admin bundle
 * carries exactly the glyphs it uses and nothing else.
 */
const paths = {
  overview: "M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z",
  projects: "M12 3.5 21 8l-9 4.5L3 8l9-4.5ZM3 12l9 4.5L21 12M3 16l9 4.5L21 16",
  media: "M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11ZM3 9h18M8 4v5M16 4v5M10.5 12.75v3.5l3.5-1.75-3.5-1.75Z",
  publish: "M12 15V4m0 0L8 8m4-4 4 4M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14",
  schedule: "M4 8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-9ZM4 11h16M8.5 4v4M15.5 4v4",
  activity: "M3 12h3.5l2-6 3.5 12 2.5-8 1.5 2H21",
  settings: "M5 7h14M5 12h14M5 17h14M9 4.75v4.5M15.5 9.75v4.5M11 14.75v4.5",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM16.2 16.2 21 21",
  bell: "M18 15.5V11a6 6 0 1 0-12 0v4.5L4.5 18h15L18 15.5ZM9.5 18a2.5 2.5 0 0 0 5 0",
  chevronDown: "m6 9.5 6 6 6-6",
  chevronRight: "m9.5 6 6 6-6 6",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "m6 6 12 12M18 6 6 18",
  plus: "M12 5v14M5 12h14",
  upload: "M12 16V5m0 0L8 9m4-4 4 4M5 16v3h14v-3",
  refresh: "M20 12a8 8 0 1 1-2.6-5.9M20 4v4h-4",
  alert: "M12 4.5 2.8 20h18.4L12 4.5ZM12 10v4.5M12 17.4v.1",
  lock: "M6 11h12v9H6v-9ZM8.5 11V8a3.5 3.5 0 1 1 7 0v3",
  check: "m5 12.5 4.5 4.5L19 7.5",
  image: "M4 5h16v14H4V5Zm0 10 4.5-4.5 4 4L15 12l5 5",
  video: "M4 6.5h11v11H4v-11Zm11 3.5 5-3v8l-5-3",
  audio: "M9 17.5V6l10-2v11.5M9 17.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm10-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z",
  archive: "M3 6h18v3H3V6Zm1.5 3h15v10h-15V9ZM9.5 13h5",
  logout: "M14 7V5H5v14h9v-2M11 12h9m0 0-3-3m3 3-3 3",
  user: "M12 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5ZM5 20a7 7 0 0 1 14 0",
  inbox: "M4 13h4l1.5 3h5L16 13h4M4 13 6.5 5h11L20 13v6H4v-6Z",
} as const;

export type IconName = keyof typeof paths;

type IconProps = SVGProps<SVGSVGElement> & { name: IconName; size?: number };

export function Icon({ name, size = 18, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
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
