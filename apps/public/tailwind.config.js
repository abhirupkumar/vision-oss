/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // CSS variable based colors for dark/light mode
        "bg-primary": "var(--bg-primary)",
        "bg-secondary": "var(--bg-secondary)",
        "bg-card": "var(--bg-card)",
        "bg-card-hover": "var(--bg-card-hover)",
        "bg-code": "var(--bg-code)",
        "t-primary": "var(--text-primary)",
        "t-secondary": "var(--text-secondary)",
        "t-muted": "var(--text-muted)",
        "bdr": "var(--border)",
        "bdr-strong": "var(--border-strong)",

        // Brand colors (obsidian charcoal, crisp cards, electric ice blue)
        "brand-dark": "#090A0F",
        "brand-card": "#11131A",
        "brand-volt": "#38BDF8",
        "brand-blue": "#0284C7",
        "brand-light": "#F8FAFC",

        "primary": "var(--accent)",
        "primary-blue": "var(--accent-secondary)",
        "primary-dim": "var(--accent-dim)",
        "c-green": "var(--green)",
        "c-blue": "var(--blue)",
        "c-purple": "var(--purple)",
        "c-amber": "var(--amber)",
        "terminal-bg": "var(--terminal-bg)",

        // Compatibility colors
        "border-light": "var(--border)",
        "text-secondary": "var(--text-secondary)",
        "surface-subtle": "var(--bg-secondary)",
        "background": "var(--bg-primary)",
        "text-primary": "var(--text-primary)",
        "surface": "var(--bg-primary)",
        "surface-container-lowest": "var(--bg-card)",
      },
      borderRadius: {
        "DEFAULT": "0.375rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "full": "9999px",
      },
      spacing: {
        "gutter": "24px",
        "margin-mobile": "16px",
        "margin-desktop": "40px",
        "container-max": "1360px",
      },
      fontFamily: {
        sans: ['Inter', 'Sora', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        "scroll-left": "scroll-left 40s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "blink": "blink 1s step-end infinite",
      },
      keyframes: {
        "scroll-left": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        blink: {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0" },
        },
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)",
      },
    }
  },
  plugins: [],
}
