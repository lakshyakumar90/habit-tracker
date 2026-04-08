/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#22c55e",
        primaryDark: "#16a34a",
        primaryLight: "#4ade80",
        bg: "#0a0f0d",
        bgSecondary: "#111714",
        card: "#151c18",
        cardBorder: "#1e2a23",
        surface: "#1a2420",
        textPrimary: "#ffffff",
        textSecondary: "#9ca3af",
        textMuted: "#6b7280",
      },
    },
  },
  plugins: [],
};