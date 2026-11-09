import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--c-canvas) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        raised: 'rgb(var(--c-raised) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        trusted: 'rgb(var(--c-trusted) / <alpha-value>)',
        watch: 'rgb(var(--c-watch) / <alpha-value>)',
        suspicious: 'rgb(var(--c-suspicious) / <alpha-value>)',
        risk: 'rgb(var(--c-risk) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'SFMono-Regular', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '10px',
      },
      transitionDuration: {
        150: '150ms',
        250: '250ms',
      },
    },
  },
  plugins: [],
} satisfies Config
