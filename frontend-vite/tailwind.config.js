/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: 'var(--surface)',
        border: 'var(--border)',
        text: 'var(--text)',
        primary: 'var(--primary)',
        'primary-600': 'var(--primary-600)',
        'primary-200': 'var(--primary-200)'
      }
    }
  },
  plugins: [],
}
