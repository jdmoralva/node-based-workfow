import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./config/**/*.{ts,tsx}",
    "./tests/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--rv-canvas)",
        surface: "var(--rv-surface)",
        border: "var(--rv-border)",
        brand: "var(--rv-brand)",
        muted: "var(--rv-muted)"
      },
      boxShadow: {
        card: "var(--rv-shadow-card)",
        panel: "var(--rv-shadow-panel)"
      },
      borderRadius: {
        shell: "var(--rv-radius-shell)"
      },
      maxWidth: {
        shell: "var(--rv-shell-width)"
      }
    }
  },
  plugins: []
};

export default config;
