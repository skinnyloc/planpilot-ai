/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			// Brand Color Palette - Professional Black & Yellow Theme
  			brand: {
  				yellow: {
  					50: '#fffbeb',
  					100: '#fef3c7',
  					200: '#fde68a',
  					300: '#fcd34d',
  					400: '#fbbf24',
  					500: '#f59e0b', // Primary yellow
  					600: '#d97706',
  					700: '#b45309',
  					800: '#92400e',
  					900: '#78350f',
  					950: '#451a03'
  				},
  				black: {
  					50: '#f8f8f8',
  					100: '#f0f0f0',
  					200: '#e4e4e4',
  					300: '#d1d1d1',
  					400: '#b4b4b4',
  					500: '#9a9a9a',
  					600: '#818181',
  					700: '#6a6a6a',
  					800: '#5a5a5a',
  					900: '#4a4a4a',
  					950: '#0a0a0a' // Deep black background
  				}
  			},
  			// CSS Variable Based Colors (maintains shadcn/ui compatibility)
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
  			// State Colors with High Contrast
  			success: {
  				DEFAULT: '#10b981', // Emerald green
  				foreground: '#ffffff'
  			},
  			warning: {
  				DEFAULT: '#f59e0b', // Brand yellow
  				foreground: '#000000'
  			},
  			error: {
  				DEFAULT: '#ef4444', // Red
  				foreground: '#ffffff'
  			},
  			info: {
  				DEFAULT: '#3b82f6', // Blue
  				foreground: '#ffffff'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}