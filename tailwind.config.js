/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
      },
      fontFamily: {
        // ブランドロゴ／見出し用の明朝系
        brand: ['"BIZ UDPMincho"', "serif"],
      },
    },
  },
  plugins: [],
};
