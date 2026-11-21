export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        canvas: 'var(--bg)',
        surface: 'var(--panel)',
        elevated: 'var(--panel-soft)',
        ink: 'var(--text)',
        subdued: 'var(--muted)',
        brand: 'var(--accent)',
      },
    },
  },
}
