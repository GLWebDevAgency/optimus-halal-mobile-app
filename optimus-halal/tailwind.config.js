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
        // Primary Colors — aligned with theme/colors.ts (source of truth: #13ec6a)
        primary: {
          DEFAULT: "#13ec6a",
          50: "#eafff3",
          100: "#c9ffe2",
          200: "#96ffc7",
          300: "#55f9a4",
          400: "#22ee7e",
          500: "#13ec6a",
          600: "#08c454",
          700: "#099a44",
          800: "#0d7939",
          900: "#0c6231",
          950: "#013719",
        },
        // Gold Accent — aligned with theme/colors.ts
        gold: {
          DEFAULT: "#D4AF37",
          50: "#fdf9e8",
          100: "#faf0c3",
          200: "#f6e18a",
          300: "#f0cc47",
          400: "#e8b824",
          500: "#D4AF37",
          600: "#c08a18",
          700: "#9a6518",
          800: "#7f501b",
          900: "#6c421c",
          950: "#3f220c",
        },
        // Background Colors — aligned with darkTheme in theme/colors.ts
        background: {
          light: "#f3f1ed",
          dark: "#0C0C0C",
        },
        // Surface Colors — aligned with darkTheme.card in theme/colors.ts
        surface: {
          light: "#ffffff",
          dark: "#1A1A1A",
        },
        // Text Colors
        text: {
          main: "#0d1b13",
          "main-dark": "#e8f5e9",
          secondary: "#4b5563",
          "secondary-dark": "#9ca3af",
        },
        // Status Colors — aligned with theme/colors.ts semantic tokens
        success: {
          DEFAULT: "#22c55e",
          light: "#dcfce7",
          dark: "#166534",
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
        // Info
        info: {
          DEFAULT: "#3b82f6",
          light: "#dbeafe",
          dark: "#1e40af",
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
        glow: "0 0 15px -3px rgba(19, 236, 106, 0.15)",
        "glow-primary": "0 0 20px rgba(19, 236, 106, 0.3)",
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
