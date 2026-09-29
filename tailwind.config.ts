import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#0E1316",
          surface: "#151B1F",
          raised: "#1B2227",
          border: "#293238",
          bordersoft: "#20272C",
        },
        ink: {
          DEFAULT: "#E7ECEE",
          muted: "#93A1A8",
          faint: "#5E6B72",
        },
        signal: {
          cyan: "#3FD6C4",
          cyandim: "#1F5C55",
          blue: "#5B9DF9",
          amber: "#F2A63D",
          red: "#F0625A",
          green: "#4ADE80",
          violet: "#A78BFA",
        },
      },
      fontFamily: {
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      backgroundImage: {
        grid: "linear-gradient(to right, #1B2227 1px, transparent 1px), linear-gradient(to bottom, #1B2227 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "28px 28px",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(63,214,196,0.25), 0 0 24px rgba(63,214,196,0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
