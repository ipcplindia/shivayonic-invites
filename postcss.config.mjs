/**
 * Tailwind is present only to drive the imported shadcn and KokonutUI
 * components. The stylesheet that turns it on is imported by the admin layout
 * alone, so the public site never loads a single Tailwind rule.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
