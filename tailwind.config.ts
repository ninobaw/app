import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
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
				// Couleurs spécifiques aéroportuaires
				aviation: {
					sky: '#0EA5E9',
					'sky-light': '#7DD3FC',
					'sky-dark': '#0284C7',
					control: '#1E40AF',
					runway: '#374151',
					terminal: '#F8FAFC',
					warning: '#F59E0B',
					success: '#10B981'
				},
				// Nouvelles couleurs pour les toasts, liées aux variables CSS
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					foreground: 'hsl(var(--info-foreground))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
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
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-in': {
					'0%': {
						transform: 'translateX(-100%)'
					},
					'100%': {
						transform: 'translateX(0)'
					}
				},
				'fly-plane': { // Nouvelle keyframe pour l'animation de l'avion
					'0%': { transform: 'translate(0, 0) rotate(0deg)', opacity: '0.7' },
					'25%': { transform: 'translate(5px, -5px) rotate(1deg)', opacity: '0.8' },
					'50%': { transform: 'translate(0, 0) rotate(0deg)', opacity: '0.7' },
					'75%': { transform: 'translate(-5px, 5px) rotate(-1deg)', opacity: '0.8' },
					'100%': { transform: 'translate(0, 0) rotate(0deg)', opacity: '0.7' },
				},
				'gradient-shift': { // Nouvelle keyframe pour le dégradé animé
					'0%': { 'background-position': '0% 50%' },
					'50%': { 'background-position': '100% 50%' },
					'100%': { 'background-position': '0% 50%' },
				},
				'bounce-in': { // Nouvelle keyframe pour l'animation de rebond
					'0%': {
						opacity: '0',
						transform: 'translateY(50px) scale(0.8)',
					},
					'60%': {
						opacity: '1',
						transform: 'translateY(-10px) scale(1.05)',
					},
					'80%': {
						transform: 'translateY(5px) scale(0.98)',
					},
					'100%': {
						transform: 'translateY(0) scale(1)',
					},
				},
				'shake': { // Nouvelle keyframe pour l'animation de secousse
					'0%, 100%': { transform: 'translateX(0)' },
					'10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-15px)' }, /* Augmenté de 10px à 15px */
					'20%, 40%, 60%, 80%': { transform: 'translateX(15px)' }, /* Augmenté de 10px à 15px */
				},
				'toast-progress': { // Nouvelle keyframe pour l'animation de la barre de progression des toasts
					from: { width: '100%' },
					to: { width: '0%' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-in': 'slide-in 0.3s ease-out',
				'fly-plane': 'fly-plane 8s ease-in-out infinite', // Nouvelle animation
				'gradient-shift': 'gradient-shift 15s ease infinite', // Animation de dégradé
				'bounce-in': 'bounce-in 0.8s ease-out forwards', // Appliquer la nouvelle animation
				'shake': 'shake 0.7s cubic-bezier(.36,.07,.19,.97) both', // Augmenté de 0.6s à 0.7s
				'toast-progress': 'toast-progress linear forwards', // Supprimé la durée ici
			},
			backgroundImage: { // Nouvelle propriété pour l'image de fond
				'wallpaper': "url('/assets/wallpaper.png')",
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;