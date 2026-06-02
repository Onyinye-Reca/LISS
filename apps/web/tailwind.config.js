/** @type {import('tailwindcss').Config} */
// Brand tokens from the PRD brand guide: Maroon/Gold, Inter, 8px grid.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        maroon: {
          DEFAULT: "#76301F",
          dark: "#5A2417",
        },
        gold: {
          DEFAULT: "#C08D33",
          light: "#D9AE5F",
        },
        cream: "#FBF7F0",
        ink: "#241712",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      spacing: {
        // 8px grid — Tailwind's default scale is already 4px-based,
        // these are convenience aliases for the 8px rhythm.
        grid: "8px",
      },
    },
  },
  plugins: [],
};
