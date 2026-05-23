/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'electric-blue': '#2563EB',
        'utem-maroon': '#8B2342',
        'snow-white': '#F8FAFC',
      },
      borderRadius: {
        'squircle': '24px',
      },
      boxShadow: {
        'soft': '0 10px 40px rgba(37, 99, 235, 0.08)',
      }
    },
  },
  plugins: [],
}
