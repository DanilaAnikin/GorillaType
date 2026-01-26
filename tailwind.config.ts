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
        // Custom theme colors using CSS variables
        bg: "var(--bg-color)",
        main: "var(--main-color)",
        caret: "var(--caret-color)",
        sub: "var(--sub-color)",
        "sub-alt": "var(--sub-alt-color)",
        text: "var(--text-color)",
        error: "var(--error-color)",
        "error-extra": "var(--error-extra-color)",
      },
      fontFamily: {
        // Monospace font families
        "roboto-mono": [
          "Roboto Mono",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
        "jetbrains-mono": [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
        "fira-code": [
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
        "source-code-pro": [
          "Source Code Pro",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      keyframes: {
        // Blink animation for caret
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        // Smooth blink animation
        "blink-smooth": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        // Pulse blink for emphasis
        "blink-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.95)" },
        },
        // Fade in animation
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        // Fade out animation
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        // Slide up animation
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Slide down animation
        "slide-down": {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Shake animation for errors
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
        },
        // Pop animation for correct keypress
        pop: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        // Blink animations
        blink: "blink 1s ease-in-out infinite",
        "blink-fast": "blink 0.5s ease-in-out infinite",
        "blink-slow": "blink 1.5s ease-in-out infinite",
        "blink-smooth": "blink-smooth 1s ease-in-out infinite",
        "blink-pulse": "blink-pulse 1s ease-in-out infinite",
        // Fade animations
        "fade-in": "fade-in 0.2s ease-out",
        "fade-in-slow": "fade-in 0.5s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
        // Slide animations
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        // Error/feedback animations
        shake: "shake 0.5s ease-in-out",
        pop: "pop 0.15s ease-out",
      },
      // Standard spacing scale matching CSS variables
      spacing: {
        "1": "0.25rem",
        "2": "0.5rem",
        "3": "0.75rem",
        "4": "1rem",
        "5": "1.25rem",
        "6": "1.5rem",
        "8": "2rem",
        "10": "2.5rem",
        "12": "3rem",
        "16": "4rem",
        "18": "4.5rem",
        "22": "5.5rem",
      },
      // Border radius configuration
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.5rem",
        lg: "0.75rem",
        full: "9999px",
        "4xl": "2rem",
      },
      // Transition duration extensions
      transitionDuration: {
        "125": "125ms",
        "250": "250ms",
        "350": "350ms",
        "400": "400ms",
      },
      // Box shadow extensions for depth
      boxShadow: {
        "inner-sm": "inset 0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "inner-md": "inset 0 2px 4px 0 rgb(0 0 0 / 0.1)",
        glow: "0 0 20px var(--main-color)",
        "glow-sm": "0 0 10px var(--main-color)",
      },
    },
  },
  plugins: [],
};

export default config;
