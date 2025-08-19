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
        primary: '#EA580C', // Orange-600
        accent: '#FB923C', // Orange-400
        dark: '#1E293B',
        'orange-50': '#FFF7ED',
        'orange-100': '#FFEDD5',
        'orange-200': '#FED7AA',
        'orange-300': '#FDBA74',
        'orange-400': '#FB923C',
        'orange-500': '#F97316',
        'orange-600': '#EA580C',
        'orange-700': '#C2410C',
        'orange-800': '#9A3412',
        'orange-900': '#7C2D12',
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
      },
    },
  },
  plugins: [],
};