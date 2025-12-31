/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Primary Colors - Emerald Green
        primary: {
          DEFAULT: "#1de560",
          50: "#edfff4",
          100: "#d5ffe6",
          200: "#aeffd0",
          300: "#70ffad",
          400: "#2bee6c",
          500: "#1de560",
          600: "#0fb350",
          700: "#0ea35c",
          800: "#0f7f49",
          900: "#10683f",
          950: "#023a21",
        },
        // Gold Accent
        gold: {
          DEFAULT: "#D4AF37",
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#fbbf24",
          500: "#D4AF37",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        // Background Colors
        background: {
          light: "#f6f8f6",
          dark: "#102216",
        },
        // Surface Colors
        surface: {
          light: "#ffffff",
          dark: "#1e293b",
        },
        // Text Colors
        text: {
          main: "#0d1b13",
          "main-dark": "#ffffff",
          secondary: "#4b5563",
          "secondary-dark": "#94a3b8",
        },
        // Status Colors
        success: {
          DEFAULT: "#10b981",
          light: "#d1fae5",
          dark: "#065f46",
        },
        warning: {
          DEFAULT: "#f59e0b",
          light: "#fef3c7",
          dark: "#92400e",
        },
        danger: {
          DEFAULT: "#ef4444",
          light: "#fee2e2",
          dark: "#991b1b",
        },
      },
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        sm: "0.125rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      boxShadow: {
        soft: "0 2px 8px -1px rgba(0, 0, 0, 0.05), 0 1px 4px -1px rgba(0, 0, 0, 0.01)",
        "soft-dark": "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
        glow: "0 0 15px -3px rgba(29, 229, 96, 0.15)",
        "glow-primary": "0 0 20px rgba(29, 229, 96, 0.3)",
        float: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.15)",
        sheet: "0 -4px 6px -1px rgba(0, 0, 0, 0.3)",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-in-up": "fadeInUp 0.5s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        ping: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
        "scan-line": "scanLine 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(100%)" },
        },
        scanLine: {
          "0%, 100%": { transform: "translateY(-50px)" },
          "50%": { transform: "translateY(50px)" },
        },
      },
    },
  },
  plugins: [],
};
