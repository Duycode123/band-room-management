/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    orange: '#FF7518',
                    orangeHover: '#E6640F',
                    greenDark: '#06331A',
                    greenLight: '#0A4D27',
                    bgGray: '#F8F9FA',
                }
            }
        },
    },
    plugins: [],
}
