/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pine: {
          DEFAULT: '#21594A',
          deep: '#163D33',
          tint: '#E4EFE9',
          light: '#2D7A64',
        },
        paper: {
          DEFAULT: '#EEF2EE',
          deep: '#E2E8E1',
          warm: '#F7F9F7',
        },
        amber: {
          DEFAULT: '#E3B341',
          light: '#F0C867',
          dark: '#C99A2E',
        },
        coral: {
          DEFAULT: '#D9534F',
          light: '#E87C79',
          dark: '#B83330',
        },
        sage: {
          DEFAULT: '#4C9A78',
          light: '#6DB896',
          dark: '#3A7A5E',
        },
        ink: {
          DEFAULT: '#182420',
          soft: '#4A5850',
          faint: '#8A9E9A',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Inter', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SFMono-Regular"', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(2.8rem, 6vw, 5rem)', { lineHeight: '1.0', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2.2rem, 4.5vw, 3.6rem)', { lineHeight: '1.05', letterSpacing: '-0.015em' }],
        'display-md': ['clamp(1.6rem, 3vw, 2.4rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(24,36,32,0.04), 0 12px 28px -8px rgba(24,36,32,0.10)',
        lift: '0 2px 4px rgba(24,36,32,0.06), 0 20px 40px -12px rgba(22,61,51,0.20)',
        'pine-glow': '0 0 40px rgba(33,89,74,0.12)',
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '20px',
        '3xl': '28px',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-in': 'slideIn 0.5s ease-out forwards',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      backgroundImage: {
        'paper-texture': "radial-gradient(1200px 600px at 85% -10%, #F4F8F3 0%, transparent 55%)",
        'pine-gradient': 'linear-gradient(135deg, #163D33 0%, #21594A 100%)',
        'hero-radial': 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(33,89,74,0.08) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
}
