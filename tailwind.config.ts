import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#E8F5EE",
          100: "#C6E8D5",
          200: "#9DD8B8",
          300: "#74C89B",
          400: "#4BB87E",
          500: "#0F5E38",
          600: "#0D5232",
          700: "#0A3F26",
          800: "#072C1B",
          900: "#041A10",
          950: "#020D08",
        },
        emerald: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
        },
        surface: {
          50: "#FAFCFB",
          100: "#F1F5F3",
          200: "#E2EBE7",
          300: "#C5D6CE",
          400: "#A8C1B5",
          500: "#8BAC9C",
          600: "#6E9783",
          700: "#51826A",
          800: "#346D51",
          900: "#1A3D2C",
        },
        dark: {
          50: "#F7F8F8",
          100: "#E3E5E4",
          200: "#C7CBC9",
          300: "#ABB1AE",
          400: "#8F9793",
          500: "#737D78",
          600: "#5A635F",
          700: "#414946",
          800: "#282F2D",
          900: "#111614",
          950: "#090C0B",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        urdu: ["var(--font-noto-nastaliq)", "Noto Nastaliq Urdu", "serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        glow: "0 0 20px rgba(15, 94, 56, 0.3)",
        "glow-lg": "0 0 40px rgba(15, 94, 56, 0.4)",
        "glow-xl": "0 0 60px rgba(15, 94, 56, 0.5), 0 0 120px rgba(15, 94, 56, 0.2)",
        "inner-glow": "inset 0 0 20px rgba(15, 94, 56, 0.15)",
        "inner-glow-lg": "inset 0 0 40px rgba(15, 94, 56, 0.25)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.12)",
        "glass-lg": "0 16px 64px rgba(0, 0, 0, 0.16)",
        elevated: "0 20px 60px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06)",
        "elevated-lg": "0 32px 80px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08)",
        "neon": "0 0 5px rgba(52, 211, 153, 0.4), 0 0 20px rgba(52, 211, 153, 0.2)",
        "neon-lg": "0 0 10px rgba(52, 211, 153, 0.5), 0 0 40px rgba(52, 211, 153, 0.3), 0 0 80px rgba(52, 211, 153, 0.1)",
        "brand-soft": "0 4px 24px rgba(15, 94, 56, 0.15)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-brand":
          "linear-gradient(135deg, #0F5E38 0%, #10B981 50%, #34D399 100%)",
        "gradient-dark":
          "linear-gradient(135deg, #111614 0%, #1A3D2C 50%, #0F5E38 100%)",
        "gradient-glass":
          "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
        "mesh-pattern":
          "radial-gradient(at 40% 20%, rgba(15, 94, 56, 0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(16, 185, 129, 0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(52, 211, 153, 0.08) 0px, transparent 50%)",
        "gradient-conic":
          "conic-gradient(from 0deg, #0F5E38, #10B981, #34D399, #10B981, #0F5E38)",
        "gradient-shine":
          "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.05) 50%, transparent 75%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-up": "fadeUp 0.6s ease-out",
        "slide-in-right": "slideInRight 0.4s ease-out",
        "slide-in-left": "slideInLeft 0.4s ease-out",
        "scale-up": "scaleUp 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s linear infinite",
        float: "float 6s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        "bounce-in": "bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards",
        "rotate-in": "rotateIn 0.5s ease-out forwards",
        "blur-in": "blurIn 0.6s ease-out forwards",
        "breathe": "breathe 3s ease-in-out infinite",
        "spin-slow": "spin 20s linear infinite",
        "scale-pulse": "scalePulse 2s ease-in-out infinite",
        "gradient-x": "gradientX 3s ease infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleUp: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 10px rgba(15, 94, 56, 0.2)" },
          "100%": { boxShadow: "0 0 30px rgba(15, 94, 56, 0.5)" },
        },
        bounceIn: {
          "0%": { opacity: "0", transform: "scale(0.3)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
          "70%": { transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        rotateIn: {
          "0%": { opacity: "0", transform: "rotate(-10deg) scale(0.9)" },
          "100%": { opacity: "1", transform: "rotate(0deg) scale(1)" },
        },
        blurIn: {
          "0%": { opacity: "0", filter: "blur(12px)" },
          "100%": { opacity: "1", filter: "blur(0px)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.8" },
          "50%": { transform: "scale(1.15)", opacity: "1" },
        },
        scalePulse: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        gradientX: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "112": "28rem",
        "128": "32rem",
      },
    },
  },
  plugins: [],
};

export default config;
