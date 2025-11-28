/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        accent: '#FF7A1A',
        darkTeal: '#1a3d3d',
        background: '#EEECE6',
        ink: {
          900: '#111111',
          700: '#3A3A3A',
          400: '#777777',
          200: '#EAEAEA'
        },
        offwhite: '#F4F4F0',
        klein: '#002FA7'
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px'
      },
      spacing: {
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '20': '20px',
        '24': '24px',
        '32': '32px',
        '40': '40px',
        '48': '48px',
        '60': '60px',
        '80': '80px',
        '120': '120px'
      },
      letterSpacing: {
        wider: '0.02em',
        widest: '0.1em'
      }
    },
  },
  plugins: [],
}

