/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx,jsx,js}"],
  theme: {
    extend: {
      colors: {
        'blue': {
          DEFAULT: '#63AFF1',
          50: '#FFFFFF',
          100: '#F9FCFE',
          200: '#D3E9FB',
          300: '#AED5F8',
          400: '#88C2F4',
          500: '#63AFF1',
          600: '#3094EC',
          700: '#1378D1',
          800: '#0E5B9E',
          900: '#0A3D6A'
        },
        'purple': {
          DEFAULT: '#9963F1',
          50: '#FFFFFF',
          100: '#FBF9FE',
          200: '#E3D3FB',
          300: '#CAAEF8',
          400: '#B288F4',
          500: '#9963F1',
          600: '#7830EC',
          700: '#5C13D1',
          800: '#450E9E',
          900: '#2F0A6A'
        },
        'pink': '#ff49db',
        'orange': '#ff7849',
        'green': '#13ce66',
        'yellow': '#ffc82c',
        'gray-dark': '#273444',
        'gray': '#8492a6',
        'gray-light': '#d3dce6',
      },
      animation: {
        text: 'text 15s ease infinite',
      },
      keyframes: {
        text: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
        },
      },
      boxShadow: {
        sphere: 'inset -25px -25px 40px rgba(0,0,0,.5)',
      }
    },
  },
  plugins: [],
};
