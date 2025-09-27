/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0f0f13',
        surface: '#1a1a1f',
        primary: {
          DEFAULT: '#ff1f8f',
          hover: '#ff47a3'
        },
        text: {
          DEFAULT: 'rgba(255, 255, 255, 0.95)',
          secondary: 'rgba(255, 255, 255, 0.7)'
        },
        border: 'rgba(255, 255, 255, 0.1)'
      },
      boxShadow: {
        sm: '0 2px 4px rgba(0, 0, 0, 0.3)',
        md: '0 4px 6px rgba(0, 0, 0, 0.4)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
        glow: '0 0 15px rgba(255, 31, 143, 0.5)'
      }
    },
  },
  plugins: [],
}