import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F7B40",
          50: "#E6F4EC",
          100: "#C2E4D0",
          500: "#0F7B40",
          600: "#0B6334",
          700: "#084B27",
        },
        accent: {
          DEFAULT: "#FFB800",
          500: "#FFB800",
        },
        ink: "#1F2937",
        paper: "#FAF7F2",
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        ethiopic: ["Noto Sans Ethiopic", "Manrope", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
