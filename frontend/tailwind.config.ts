import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-border": "rgb(var(--surface-border) / <alpha-value>)",
        // Constant dark text used on colored/accent buttons (both themes)
        ink: "rgb(var(--ink) / <alpha-value>)",
        // Glass overlays: white in dark theme, black in light theme
        glass: "rgb(var(--glass) / <alpha-value>)",
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          hover: "rgb(var(--accent-hover) / <alpha-value>)",
          light: "rgb(var(--accent) / 0.12)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          hover: "rgb(var(--secondary-hover) / <alpha-value>)",
          light: "rgb(var(--secondary) / 0.12)",
        },
        highlight: {
          DEFAULT: "rgb(var(--highlight) / <alpha-value>)",
          hover: "rgb(var(--highlight-hover) / <alpha-value>)",
          light: "rgb(var(--highlight) / 0.12)",
        },
        "text-primary": "rgb(var(--text-primary) / <alpha-value>)",
        "text-muted": "rgb(var(--text-muted) / <alpha-value>)",
        danger: {
          DEFAULT: "rgb(var(--danger) / <alpha-value>)",
          hover: "rgb(var(--danger-hover) / <alpha-value>)",
          light: "rgb(var(--danger) / 0.12)",
        },
        success: {
          DEFAULT: "rgb(var(--success) / <alpha-value>)",
          hover: "rgb(var(--success-hover) / <alpha-value>)",
          light: "rgb(var(--success) / 0.12)",
        },
      },
      fontFamily: {
        heading: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      borderRadius: {
        card: "16px",
        button: "12px",
        input: "10px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)",
        "card-hover":
          "0 8px 25px rgba(0,0,0,0.4), 0 0 0 1px rgb(var(--accent) / 0.08), inset 0 1px 0 rgba(255,255,255,0.02)",
        drawer: "-8px 0 30px rgba(0,0,0,0.5)",
        glow: "0 0 20px rgb(var(--accent) / 0.15)",
      },
      keyframes: {
        "slide-in-right": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)", opacity: "1" },
          to: { transform: "translateX(100%)", opacity: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "toast-in": {
          from: { transform: "translateX(120%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-out-right": "slide-out-right 0.3s ease-in",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.4s ease-out",
        shimmer: "shimmer 2s infinite linear",
        "toast-in": "toast-in 0.4s ease-out",
        "pulse-soft": "pulse-soft 2s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
