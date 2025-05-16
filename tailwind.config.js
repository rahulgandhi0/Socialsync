/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gradient-start': '#6366f1', // indigo
        'gradient-mid': '#8b5cf6',   // purple
        'gradient-end': '#ec4899',   // pink
        'surface': {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        }
      },
      backgroundImage: {
        'glow-gradient': 'linear-gradient(45deg, var(--tw-gradient-stops))',
        'flow-gradient': 'linear-gradient(60deg, var(--tw-gradient-stops))',
        'mesh-gradient': 'radial-gradient(at 50% 0%, rgba(99, 102, 241, 0.1) 0px, transparent 75%), radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.1) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.1) 0px, transparent 50%)',
        'glass-gradient': 'linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4))',
      },
      animation: {
        'glow-flow': 'glow-flow 8s ease infinite',
        'text-shimmer': 'text-shimmer 3s ease-in-out infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'glow-flow': {
          '0%, 100%': { 
            backgroundPosition: '0% 50%',
            backgroundSize: '200% 200%',
          },
          '50%': { 
            backgroundPosition: '100% 50%',
            backgroundSize: '200% 200%', 
          },
        },
        'text-shimmer': {
          '0%, 100%': { 
            textShadow: '0 0 2px rgba(255, 255, 255, 0.2), 0 0 10px rgba(255, 255, 255, 0.2)'
          },
          '50%': { 
            textShadow: '0 0 5px rgba(255, 255, 255, 0.4), 0 0 20px rgba(255, 255, 255, 0.4)'
          }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8 }
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-strong': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'glass-hover': '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
        'neon': '0 0 5px theme(colors.gradient-start), 0 0 20px theme(colors.gradient-mid)',
        'neon-strong': '0 0 10px theme(colors.gradient-start), 0 0 40px theme(colors.gradient-mid)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.text-gradient': {
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          'color': 'transparent',
        },
        '.bg-gradient': {
          'background-size': '200% 200%',
          'background-position': '0% 0%',
        },
        '.glass': {
          'background': 'rgba(255, 255, 255, 0.7)',
          'backdrop-filter': 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
        },
        '.glass-dark': {
          'background': 'rgba(0, 0, 0, 0.7)',
          'backdrop-filter': 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
        },
        '.glass-hover': {
          'transition': 'all 0.3s ease-in-out',
          '&:hover': {
            'background': 'rgba(255, 255, 255, 0.8)',
            'backdrop-filter': 'blur(12px)',
            '-webkit-backdrop-filter': 'blur(12px)',
          }
        },
        '.line-clamp-1': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '1',
        },
        '.line-clamp-2': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '2',
        },
        '.aspect-w-16': {
          position: 'relative',
          paddingBottom: 'calc(9 / 16 * 100%)',
        },
        '.aspect-h-9': {
          position: 'absolute',
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
          height: '100%',
          width: '100%',
          objectFit: 'cover',
        }
      }
      addUtilities(newUtilities)
    }
  ],
}

