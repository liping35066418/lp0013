/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF3ED',
          100: '#FFE2D3',
          200: '#FFC3A6',
          300: '#FFA579',
          400: '#FF8D5C',
          500: '#FF7A45',
          600: '#F0652E',
          700: '#CC5320',
          800: '#993E17',
          900: '#662910',
        },
        secondary: {
          50: '#E8F1F2',
          100: '#C7DEE1',
          200: '#8EBBC2',
          300: '#5598A3',
          400: '#317A86',
          500: '#1A535C',
          600: '#144049',
          700: '#0F2E35',
          800: '#0A1F23',
          900: '#050F11',
        },
      },
      fontFamily: {
        sans: ['PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-small': 'bounce-small 0.5s ease-in-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.4s ease-out',
        'fadeIn': 'fadeIn 0.3s ease-out',
        'fadeInDown': 'fadeInDown 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        'scaleIn': 'scaleIn 0.25s ease-out',
      },
      keyframes: {
        'bounce-small': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fadeIn': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fadeInDown': {
          '0%': { opacity: '0', transform: 'translate(-50%, -10px)' },
          '100%': { opacity: '1', transform: 'translate(-50%, 0)' },
        },
        'scaleIn': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
