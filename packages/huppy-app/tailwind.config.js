/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './sources/**/*.{js,ts,jsx,tsx}',
        './src-tauri/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: '#FF9A3C',
                'primary-dark': '#FF6B1A',
                background: '#0D0D0D',
                surface: '#1A1A1A',
                'surface-elevated': '#252525',
                border: '#2A2A2A',
                'text-primary': '#FFFFFF',
                'text-secondary': '#888888',
                // AI brand colors
                claude: '#CC785C',
                gemini: '#4285F4',
                codex: '#412991',
            },
            borderRadius: {
                'huppy-sm': '8px',
                'huppy-md': '12px',
                'huppy-lg': '20px',
            },
        },
    },
    plugins: [],
}
