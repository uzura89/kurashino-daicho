/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // OGPと同じ濃紺インク
        ink: "#222d42",
      },
      fontFamily: {
        // ブランドロゴ／見出し用の明朝系
        brand: ['"BIZ UDPMincho"', "serif"],
      },
      boxShadow: {
        // 紙が浮いているような柔らかい影
        paper:
          "0 1px 2px rgba(34, 45, 66, 0.05), 0 12px 32px -14px rgba(34, 45, 66, 0.18)",
      },
    },
  },
  plugins: [],
};
