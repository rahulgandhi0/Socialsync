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
      },
      backgroundImage: {
        'glow-gradient': 'linear-gradient(45deg, var(--tw-gradient-stops))',
        'flow-gradient': 'linear-gradient(60deg, var(--tw-gradient-stops))',
      },
      animation: {
        'glow-flow': 'glow-flow 8s ease infinite',
        'text-shimmer': 'text-shimmer 3s ease-in-out infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
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
        'gradient-y': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'center top'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'center center'
          }
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        'gradient-xy': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        }
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

