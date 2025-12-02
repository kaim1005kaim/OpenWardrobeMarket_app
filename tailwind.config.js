/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        accent: '#FF7A1A',
        darkTeal: '#1a3d3d',
        background: '#F2F0E9', // Rich & Minimal: 和紙のような温かみのあるオフホワイト
        ink: {
          900: '#1A1A1A', // 墨色（完全な黒ではない）
          700: '#3A3A3A',
          600: '#5A5A5A', // セカンダリテキスト
          400: '#777777',
          200: '#DCDCDC', // UIボーダー
          50: '#F8F7F4'   // 紙のテクスチャ背景
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
