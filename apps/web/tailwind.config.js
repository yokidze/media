/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef3f8',
          100: '#d4e0ed',
          200: '#afc4dc',
          300: '#789dbf',
          400: '#4f789f',
          500: '#395f84',
          600: '#2e4d6a',
          700: '#253d54',
          800: '#1f3347',
          900: '#1c2b3c'
        },
        accent: {
          500: '#9b6c3f',
          600: '#7a522f'
        }
      },
      boxShadow: {
        soft: '0 8px 30px rgba(29, 47, 70, 0.08)'
      }
    }
  },
  plugins: []
};
