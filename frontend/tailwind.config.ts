import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "Fira Code", "monospace"],
      },
      borderRadius: {
        card: "16px",
        "card-lg": "24px",
        pill: "9999px",
      },
      colors: {
        emerald: {
          900: "#052e24",
          700: "#0d5f45",
          600: "#0f7a57",
          500: "#14b881",
          400: "#4fd8a8",
          300: "#8fe9c8",
        },
        amber: {
          500: "#f5a623",
          400: "#ffc35c",
        },
        success: "#14b881",
        danger: "#ef4444",
        warning: "#f5a623",
        info: "#38bdf8",
      },
      animation: {
        "fade-in": "fadeIn 0.45s ease both",
        "fade-up": "fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both",
        "scale-in": "scaleIn 0.35s cubic-bezier(0.16,1,0.3,1) both",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
