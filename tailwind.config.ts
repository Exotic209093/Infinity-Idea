import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        accent: {
          cyan: "#22d3ee",
          pink: "#ec4899",
          amber: "#f59e0b",
        },
        canvas: {
          bg: "#0b0b16",
          surface: "rgba(255,255,255,0.06)",
          border: "rgba(255,255,255,0.12)",
        },
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #6c63ff 0%, #a855f7 50%, #ec4899 100%)",
        "canvas-wash":
          "radial-gradient(1200px 600px at 20% -10%, rgba(108,99,255,0.25), transparent 60%), radial-gradient(900px 500px at 90% 10%, rgba(236,72,153,0.18), transparent 60%), linear-gradient(180deg, #0a0a14 0%, #0b0b16 100%)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.35)",
        glow: "0 0 24px rgba(124,58,237,0.45)",
      },
      backdropBlur: {
        glass: "14px",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
