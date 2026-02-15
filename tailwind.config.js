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
                // Cores baseadas no logo Ly Vest (Bordô Elegante)
                'lyvest': {
                    50: '#FDF8F8',
                    100: '#F5E6E8',
                    200: '#E8C4C8',
                    300: '#D9A0A8',
                    400: '#C05060',
                    500: '#800020', // Cor principal - Bordô
                    600: '#600018',
                    700: '#500014',
                    800: '#400010',
                    900: '#30000C',
                },
            },
            fontFamily: {
                sans: ['var(--font-lato)', 'sans-serif'],
                cookie: ['var(--font-cookie)', 'cursive'],
                lato: ['var(--font-lato)', 'sans-serif'],
                inter: ['var(--font-inter)', 'sans-serif'],
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
