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
        background: "#0F0F0F",
        surface: "#1A1A1A",
        "surface-border": "#2A2A2A",
        accent: {
          DEFAULT: "#E8A87C",
          hover: "#D4956A",
          light: "rgba(232, 168, 124, 0.12)",
        },
        secondary: {
          DEFAULT: "#7C9E87",
          hover: "#6B8D76",
          light: "rgba(124, 158, 135, 0.12)",
        },
        highlight: {
          DEFAULT: "#C084FC",
          hover: "#A855F7",
          light: "rgba(192, 132, 252, 0.12)",
        },
        "text-primary": "#F5F0EB",
        "text-muted": "#8A8A8A",
        danger: {
          DEFAULT: "#E07070",
          hover: "#D45F5F",
          light: "rgba(224, 112, 112, 0.12)",
        },
        success: {
          DEFAULT: "#6FCF97",
          hover: "#5FBF87",
          light: "rgba(111, 207, 151, 0.12)",
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
          "0 8px 25px rgba(0,0,0,0.4), 0 0 0 1px rgba(232,168,124,0.08), inset 0 1px 0 rgba(255,255,255,0.02)",
        drawer: "-8px 0 30px rgba(0,0,0,0.5)",
        glow: "0 0 20px rgba(232,168,124,0.15)",
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
