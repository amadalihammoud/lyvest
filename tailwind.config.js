/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/**/*.{js,ts,jsx,tsx}",
    ],

    theme: {
        container: {
            center: true,
            padding: {
                DEFAULT: '1rem',
                sm: '1.5rem',
                lg: '2rem',
            },
        },
        extend: {
            screens: {
                'xs': '400px',
            },
            colors: {
                // ─── Tokens semânticos ─────────────────────────────────────
                background: 'hsl(var(--background) / <alpha-value>)',
                foreground: 'hsl(var(--foreground) / <alpha-value>)',
                muted: {
                    DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
                    foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
                    foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
                    foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
                },
                border: 'hsl(var(--border) / <alpha-value>)',
                ring: 'hsl(var(--ring) / <alpha-value>)',

                // ─── Paleta Oficial — Manual de Marca Ly Vest v7 ───────────
                // PALETA PRINCIPAL
                'lyvest': {
                    // Vermelho Carmim (#7D2121) — cor principal
                    50: '#FEF8F8',
                    100: '#F8E8E8',
                    200: '#EDCACA',
                    300: '#DFA6A6',
                    400: '#AD4A4A',
                    500: '#7D2121', // ← Vermelho Carmim (principal)
                    600: '#651A1A',
                    700: '#501515',
                    800: '#3C1010',
                    900: '#280B0B',
                },
                'lyvest-black': '#0D0D0D',
                'lyvest-cream': '#F5EDE8',

                // PALETA SECUNDÁRIA
                'lyvest-terracota': '#C4927A',
                'lyvest-siena': '#9E6B5A',
                'lyvest-mist': '#EAD9D1',
                'lyvest-stone': '#7A6E66', // Neutro quente para textos secundários
            },
            fontFamily: {
                // Sans premium (corpo) — Inter primário, Helvetica/Arial fiel ao Manual como fallback
                sans: ['var(--font-sans)', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
                // Serif editorial (display/títulos) — Cormorant Garamond
                serif: ['var(--font-serif)', 'Cormorant Garamond', 'Georgia', 'serif'],
                display: ['var(--font-serif)', 'Cormorant Garamond', 'Georgia', 'serif'],
            },
            letterSpacing: {
                'editorial': '0.18em',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            animation: {
                'fade-in': 'fade-in 0.4s ease-out',
                'fade-up': 'fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                'scale-up': 'scale-up 0.3s ease-out',
                'bounce-in': 'bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                'blob': 'blob 7s infinite',
                'shimmer': 'shimmer 2.5s linear infinite',
            },
            keyframes: {
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                'fade-up': {
                    from: { opacity: '0', transform: 'translateY(16px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'scale-up': {
                    from: { opacity: '0', transform: 'scale(0.96)' },
                    to: { opacity: '1', transform: 'scale(1)' },
                },
                'bounce-in': {
                    '0%': { opacity: '0', transform: 'translateX(100px)' },
                    '60%': { opacity: '1', transform: 'translateX(-10px)' },
                    '80%': { transform: 'translateX(5px)' },
                    '100%': { transform: 'translateX(0)' },
                },
                blob: {
                    '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
                    '25%': { transform: 'translate(20px, -20px) scale(1.1)' },
                    '50%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '75%': { transform: 'translate(20px, 20px) scale(1.05)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
        },
    },
    plugins: [],
}
