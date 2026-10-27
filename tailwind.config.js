/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        DEFAULT: '0px',
        sm: '2px',
        md: '2px',
        lg: '4px',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        lab: {
          bg: '#f1f5f9',
          panel: '#ffffff',
          toolbar: '#e2e8f0',
          border: '#cbd5e1',
          borderDark: '#94a3b8',
          text: '#0f172a',
          muted: '#475569',
          accent: '#1e3a8a',
          accentHover: '#172554',
          highlight: '#e2e8f0',
        }
      }
    },
  },
  plugins: [],
}
