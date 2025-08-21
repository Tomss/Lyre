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
        'orange-25': '#FFFBF7',
        'orange-100': '#FFEDD5',
        'orange-200': '#FED7AA',
        'orange-300': '#FDBA74',
        'orange-400': '#FB923C',
        'orange-500': '#F97316',
        'orange-600': '#EA580C',
        'orange-700': '#C2410C',
        'orange-800': '#9A3412',
        'orange-900': '#7C2D12',
        'amber-25': '#FFFDF5',
        'yellow-25': '#FFFEF0',
        'blue-25': '#F8FAFF',
        'indigo-25': '#F8F9FF',
        'purple-25': '#FAFAFF',
        'emerald-25': '#F0FDF9',
        'teal-25': '#F0FDFA',
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