/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        primary: 'var(--color-primary)', // Main Brand Color
        accent: 'var(--color-accent)',   // Lighter/Highlight
        dark: '#1E293B',
        // Hijack Teal to be the Primary Color
        teal: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
          950: 'var(--color-primary-900)', // simplified
        },
        // Hijack Orange to be the Primary Color (legacy support)
        'orange-50': 'var(--color-primary-50)',
        'orange-25': 'var(--color-primary-25)',
        'orange-100': 'var(--color-primary-100)',
        'orange-200': 'var(--color-primary-200)',
        'orange-300': 'var(--color-primary-300)',
        'orange-400': 'var(--color-primary-400)',
        'orange-500': 'var(--color-primary-500)',
        'orange-600': 'var(--color-primary-600)',
        'orange-700': 'var(--color-primary-700)',
        'orange-800': 'var(--color-primary-800)',
        'orange-900': 'var(--color-primary-900)',
        // Mapping Amber to Secondary/Cyan Ramp
        'amber-25': 'var(--color-secondary-25)',
        'amber-50': 'var(--color-secondary-50)',
        'amber-100': 'var(--color-secondary-100)',
        'amber-200': 'var(--color-secondary-200)',
        'amber-300': 'var(--color-secondary-300)',
        'amber-400': 'var(--color-secondary-400)',
        'amber-500': 'var(--color-secondary-500)',
        'amber-600': 'var(--color-secondary-600)',
        'amber-700': 'var(--color-secondary-700)',
        'amber-800': 'var(--color-secondary-800)',
        'amber-900': 'var(--color-secondary-900)',
        // Keep other custom colors (static for now)
        'yellow-25': '#F0F9FF', // Sky-ish
        'blue-25': '#F8FAFF',
        'indigo-25': '#F8F9FF',
        'purple-25': '#FAFAFF',
        'emerald-25': '#F0FDF9',
        'teal-25': 'var(--color-primary-25)', // Consistent
        'cyan-25': '#ECFEFF',
        'slate-25': '#FAFAFA',
        'gray-25': '#FAFAFA',
        'rose-25': '#FFF1F2',
        'pink-25': '#FDF2F8',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-in-out',
        'fade-in-up': 'fadeInUp 0.8s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        floatNote: {
          '0%': {
            transform: 'translateY(100vh) translateX(0) rotate(0deg)',
            opacity: '0.3'
          },
          '5%': {
            opacity: '0.8'
          },
          '95%': {
            opacity: '0.8'
          },
          '100%': {
            transform: 'translateY(-100px) translateX(var(--drift, 20px)) rotate(360deg)',
            opacity: '0'
          },
        },
        'float-note': {
          '0%': {
            transform: 'translateY(100vh) translateX(0) rotate(0deg)',
            opacity: '0'
          },
          '5%': {
            opacity: '0.3'
          },
          '95%': {
            opacity: '0.3'
          },
          '100%': {
            transform: 'translateY(-100px) translateX(var(--drift, 20px)) rotate(360deg)',
            opacity: '0'
          },
        },
      },
    },
  },
  plugins: [],
};