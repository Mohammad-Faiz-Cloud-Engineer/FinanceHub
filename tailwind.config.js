/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border-hsl) / <alpha-value>)",
        input: "hsl(var(--input-hsl) / <alpha-value>)",
        ring: "hsl(var(--ring-hsl) / <alpha-value>)",
        background: "hsl(var(--background-hsl) / <alpha-value>)",
        foreground: "hsl(var(--foreground-hsl) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary-hsl) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground-hsl) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary-hsl) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground-hsl) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive-hsl) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground-hsl) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted-hsl) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground-hsl) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent-hsl) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground-hsl) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover-hsl) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground-hsl) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card-hsl) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground-hsl) / <alpha-value>)",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
