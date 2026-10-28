/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#05080A',
          900: '#0A1014',
          850: '#0E161B',
          800: '#131E24',
          700: '#1C2A31',
          600: '#2A3A42',
        },
        leaf: {
          50: '#ECFDF3',
          200: '#A7F3C9',
          300: '#6EE7A8',
          400: '#34D88A',
          500: '#16C172',
          600: '#0E9F5D',
          700: '#0B7A48',
        },
        amberx: { 300: '#FCD47D', 400: '#F7B946', 500: '#E99A1C' },
        violetx: { 300: '#C4B5FD', 400: '#A78BFA', 500: '#8B5CF6' },
        skyx: { 300: '#7DD3FC', 400: '#38BDF8', 500: '#0EA5E9' },
        rosex: { 300: '#FDA4AF', 400: '#FB7185', 500: '#F43F5E' },
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        inter: ['Inter_400Regular'],
        'inter-md': ['Inter_500Medium'],
        'inter-sb': ['Inter_600SemiBold'],
        'inter-b': ['Inter_700Bold'],
        'inter-xb': ['Inter_800ExtraBold'],
        grotesk: ['SpaceGrotesk_600SemiBold'],
        'grotesk-md': ['SpaceGrotesk_500Medium'],
        'grotesk-b': ['SpaceGrotesk_700Bold'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
      },
    },
  },
  plugins: [],
};
