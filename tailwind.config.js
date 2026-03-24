/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blushPink: '#F88379',
        softPink: '#FFD1DC',
        creamyWhite: '#FFF8E7',
        warmCream: '#FAF0E6',
        darkBrown: '#4A3B3B',
        softBrown: '#6B4F4F',
        // Premium theme colors
        premiumPink: '#ff4458',
        premiumPurple: '#b344ff',
        premiumBlue: '#4da6ff',
        premiumDark: '#0a0a0d',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['DM Serif Display', 'ui-serif', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}

