/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Base Palette Tokens from Design System
        canvas: "#080808",
        deepBlack: "#000000",
        charcoal: "#242424",
        vividOrange: {
          DEFAULT: "#FF4B16",
          hover: "#E03E0E",
          active: "#C8340A",
        },
        electricPurple: {
          DEFAULT: "#5035E8",
          hover: "#432BC7",
          light: "#725CF0",
        },
        softPink: {
          DEFAULT: "#E88BD2",
          dark: "#D06EBA",
        },
        palePink: {
          DEFAULT: "#F5B8E8",
          subtle: "#FCE5F7",
        },
        emeraldGreen: {
          DEFAULT: "#079C68",
          hover: "#068659",
        },
        softGreen: {
          DEFAULT: "#65B77A",
          light: "#82C894",
        },
        offWhite: {
          DEFAULT: "#F2F2F5",
          hover: "#E5E5EB",
        },
        coolGray: {
          DEFAULT: "#DDE0E1",
          subtle: "#ECEEF0",
        },
        mutedText: "#A6A6AC",
        primaryText: "#F5F5F5",
        darkText: "#111111",

        // Semantic Role Mapping
        background: "#080808",
        foreground: "#F5F5F5",
        app: "#080808",
        card: {
          DEFAULT: "#121212",
          secondary: "#1A1A1A",
          elevated: "#242424",
          foreground: "#F5F5F5",
          white: "#F2F2F5",
        },
        surface: {
          DEFAULT: "#121212",
          deep: "#000000",
          elevated: "#242424",
          subtle: "#161616",
        },
        border: {
          DEFAULT: "#242424",
          subtle: "#1A1A1A",
          charcoal: "#242424",
          elevated: "#333333",
          light: "#E0E2E5",
        },
        primary: {
          DEFAULT: "#FF4B16",
          foreground: "#111111",
          hover: "#E03E0E",
        },
        secondary: {
          DEFAULT: "#5035E8",
          foreground: "#F5F5F5",
          hover: "#432BC7",
        },
        accent: {
          DEFAULT: "#FF4B16",
          foreground: "#111111",
          purple: "#5035E8",
          pink: "#E88BD2",
          green: "#079C68",
        },
        destructive: {
          DEFAULT: "#E63946",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#079C68",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#F59E0B",
          foreground: "#111111",
        },
        muted: {
          DEFAULT: "#1A1A1A",
          foreground: "#A6A6AC",
        },
      },
      borderRadius: {
        'xs': '3px',
        'sm': '4px',
        'md': '5px',
        'lg': '6px',
        'xl': '7px',
        '2xl': '10px',
        '3xl': '12px',
        '4xl': '14px',
        'panel': '13px',
        'card': '10px',
        'control': '7px',
      },
      boxShadow: {
        'subtle': '0 2px 8px -2px rgba(0, 0, 0, 0.5)',
        'elevated': '0 12px 32px -4px rgba(0, 0, 0, 0.7)',
        'glow-orange': '0 0 24px -4px rgba(255, 75, 22, 0.35)',
        'glow-purple': '0 0 24px -4px rgba(80, 53, 232, 0.35)',
      },
    },
  },
  plugins: [],
}
