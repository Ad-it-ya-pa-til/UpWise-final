/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: '#FAF7F2',
        paper: {
          DEFAULT: '#FAF7F2',
          light: '#FFFFFF',
          card: '#FFFFFF',
          soft: '#FDFBF7',
          dark: '#F2ECE1',
          border: '#E8E2D8',
        },
        forest: {
          DEFAULT: '#0F392B',
          dark: '#0A261D',
          light: '#EBF3EF',
          hover: '#184837',
          border: '#1E523F',
        },
        ink: {
          DEFAULT: '#141412',
          rich: '#0D0D0B',
          body: '#3A3732',
          muted: '#55504A',
          subtle: '#78716C',
          light: '#9E978E',
        },
        vermilion: {
          DEFAULT: '#D95D39',
          dark: '#B83214',
          light: '#FBF2EF',
          border: '#F3D5CC',
          hover: '#C14B29',
        },
        terracotta: {
          DEFAULT: '#D95D39',
          dark: '#C14B29',
          light: '#FBF2EF',
        },
        saffron: {
          DEFAULT: '#D97706',
          dark: '#B45309',
          light: '#FEF3C7',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          warm: '#FDFBF7',
          paper: '#FAF7F2',
          card: '#FFFFFF',
          elevated: '#FFFFFF',
        },
        border: {
          DEFAULT: '#E8E2D8',
          dark: '#D4CBBF',
          light: '#F0ECE3',
        },
        brand: {
          vermilion: '#D95D39',
          'vermilion-light': '#FBF2EF',
          'vermilion-hover': '#C14B29',
          forest: '#0F392B',
          'forest-light': '#EBF3EF',
          'forest-hover': '#184837',
          indigo: '#0F392B',
          'indigo-light': '#EBF3EF',
          'indigo-hover': '#184837',
          emerald: '#0F392B',
          'emerald-light': '#EBF3EF',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Newsreader"', 'Georgia', 'serif'],
        headline: ['"Newsreader"', 'Georgia', 'serif'],
        editorial: ['"Newsreader"', 'Georgia', 'serif'],
        display: ['"Newsreader"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(20, 20, 18, 0.03)',
        'subtle': '0 1px 3px 0 rgba(20, 20, 18, 0.04), 0 1px 2px -1px rgba(20, 20, 18, 0.02)',
        'editorial': '0 1px 3px 0 rgba(20, 20, 18, 0.04), 0 4px 12px -2px rgba(20, 20, 18, 0.03)',
        'popover': '0 12px 32px -4px rgba(20, 20, 18, 0.08), 0 4px 12px -2px rgba(20, 20, 18, 0.04)',
        'modal': '0 20px 40px -8px rgba(20, 20, 18, 0.12)',
      },
    },
  },
  plugins: [],
}
