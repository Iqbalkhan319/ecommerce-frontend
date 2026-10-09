/**
 * Shared design tokens for both applications.
 *
 * The visual identity is deliberately its own: a warm paper background, deep ink text
 * and a single deep-emerald accent, with brass reserved for small highlights. Colours
 * are declared as CSS variables so light and dark themes swap without a class rewrite.
 */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: 'rgb(var(--colour-ink) / <alpha-value>)',
          soft: 'rgb(var(--colour-ink-soft) / <alpha-value>)',
          muted: 'rgb(var(--colour-ink-muted) / <alpha-value>)',
        },
        paper: 'rgb(var(--colour-paper) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--colour-surface) / <alpha-value>)',
          raised: 'rgb(var(--colour-surface-raised) / <alpha-value>)',
          sunken: 'rgb(var(--colour-surface-sunken) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--colour-line) / <alpha-value>)',
          strong: 'rgb(var(--colour-line-strong) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--colour-accent) / <alpha-value>)',
          hover: 'rgb(var(--colour-accent-hover) / <alpha-value>)',
          soft: 'rgb(var(--colour-accent-soft) / <alpha-value>)',
          contrast: 'rgb(var(--colour-accent-contrast) / <alpha-value>)',
        },
        brass: 'rgb(var(--colour-brass) / <alpha-value>)',
        positive: 'rgb(var(--colour-positive) / <alpha-value>)',
        caution: 'rgb(var(--colour-caution) / <alpha-value>)',
        critical: 'rgb(var(--colour-critical) / <alpha-value>)',
        info: 'rgb(var(--colour-info) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'ui-serif', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.04em' }],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        subtle: '0 1px 2px rgb(20 21 26 / 0.04), 0 1px 3px rgb(20 21 26 / 0.06)',
        raised: '0 2px 4px rgb(20 21 26 / 0.04), 0 8px 24px rgb(20 21 26 / 0.08)',
        overlay: '0 12px 48px rgb(20 21 26 / 0.18)',
      },
      spacing: { 18: '4.5rem', 22: '5.5rem' },
      maxWidth: { prose: '68ch', shell: '84rem' },
      transitionTimingFunction: { entrance: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-up': 'fade-up 220ms cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
};
