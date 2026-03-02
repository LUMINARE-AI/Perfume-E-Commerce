/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        luxuryBlack: "#0B0B0B",
        luxuryGold: "#D4AF37",
        softGold: "#F5E6B8",
        mutedGray: "#9CA3AF",
      },
      fontFamily: {
        luxury: ["Playfair Display", "serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
