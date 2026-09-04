/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Data Leaf palette. Values come from the brand skill's tokens.css,
        // referenced here as CSS custom properties rather than retyped hex.
        mint: 'var(--dl-mint-cream)',
        silver: 'var(--dl-silver)',
        ink: 'var(--dl-deep-space)',
        teal: 'var(--dl-deep-teal)',
        clay: 'var(--dl-burnt-clay)',
      },
      fontFamily: {
        heading: ['DM Sans', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
}
