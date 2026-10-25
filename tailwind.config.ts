import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Stark monochrome palette. Ink carries every action; the only other
        // surfaces are paper (white) and a warm off-white for tinted blocks.
        ink: {
          DEFAULT: "#0A0A0A",
          muted: "#6B6B6B",
          line: "#E4E2DE",
        },
        paper: {
          DEFAULT: "#FFFFFF",
          warm: "#F7F6F4",
        },
        // Kept so existing `accent` utilities resolve to the new palette.
        accent: {
          DEFAULT: "#0A0A0A",
          dark: "#000000",
          light: "#F2F0ED",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        // Wide tracking on small uppercase labels does most of the work here.
        label: "0.18em",
        wider: "0.24em",
      },
    },
  },
  plugins: [],
};

export default config;
