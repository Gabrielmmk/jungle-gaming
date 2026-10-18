import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        'surface-card': 'var(--surface-card)',
        'surface-dark': 'var(--surface-dark)',
        border: 'var(--border)',
        'border-soft': 'var(--border-soft)',
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        'text-accent': 'var(--text-accent)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        foreground: 'var(--foreground)',
        'background-elevated': 'var(--background-elevated)',
        background: 'var(--background)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--text-secondary)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--ink)',
        },
        ring: 'var(--ring)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        mono: ["'Roboto Mono'", 'monospace'],
      },
      fontSize: {
        tiny: ['10px', '100%'],
        caption: ['12px', '14px'],
        body: ['14px', '22px'],
        'body-lg': ['16px', '20px'],
        heading: ['24px', '100%'],
        display: ['43px', '70px'],
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
