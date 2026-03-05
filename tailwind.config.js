/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/**/*.{js,ts,jsx,tsx}",
    ],

    theme: {
        extend: {
            screens: {
                'xs': '400px', // Extra small screens - controls wrap below this
            },
            colors: {
                // ─── Paleta Oficial — Manual de Marca Ly Vest v7 ───────────────
                // PALETA PRINCIPAL
                'lyvest': {
                    // Vermelho Carmim (#7D2121) — cor principal, 60% do uso visual
                    50: '#FEF8F8',
                    100: '#F8E8E8',
                    200: '#EDCACA',
                    300: '#DFA6A6',
                    400: '#AD4A4A',
                    500: '#7D2121', // ← Vermelho Carmim (principal) — Manual §03
                    600: '#651A1A',
                    700: '#501515',
                    800: '#3C1010',
                    900: '#280B0B',
                },
                // Preto Absoluto — neutrals / texto
                'lyvest-black': '#0D0D0D',
                // Creme Marfim — background, superfícies
                'lyvest-cream': '#F5EDE8',

                // PALETA SECUNDÁRIA
                'lyvest-terracota': '#C4927A', // Terracota Rosé
                'lyvest-siena': '#9E6B5A', // Siena
                'lyvest-mist': '#EAD9D1', // Névoa Rosada
                // Branco Puro já coberto pelo white padrão do Tailwind
            },
            fontFamily: {
                // Tipografia oficial: Helvetica / Arial (fontes do sistema)
                // Lato mantido como fallback para ambientes sem Helvetica
                sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'var(--font-lato)', 'sans-serif'],
                cookie: ['var(--font-cookie)', 'cursive'],
                lato: ['var(--font-lato)', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fade-in 0.3s ease-out',
                'scale-up': 'scale-up 0.2s ease-out',
                'bounce-in': 'bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                'blob': 'blob 7s infinite',
            },
            keyframes: {
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                'scale-up': {
                    from: { opacity: '0', transform: 'scale(0.95)' },
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
            },
        },
    },
    plugins: [],
}
