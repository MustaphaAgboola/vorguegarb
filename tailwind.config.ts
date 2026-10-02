import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // One accent colour for the whole brand.
        accent: {
          DEFAULT: "#B45309",
          dark: "#92400E",
          light: "#FDF3E7",
        },
      },
    },
  },
  plugins: [],
};

export default config;
