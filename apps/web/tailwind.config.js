/** @type {import('tailwindcss').Config} */
// Brand tokens from the PRD brand guide: Maroon/Gold, Inter, 8px grid.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Exact palette from PRD section 9.1.
        maroon: {
          DEFAULT: "#76301F", // primary
          dark: "#5A2417", // button hover
        },
        gold: {
          DEFAULT: "#C08D33", // accent
          light: "#D9AE5F",
        },
        cream: "#FDF8F2", // light page background
        card: "#FEF3E8", // card / form fill
        ink: "#4A3728", // body text (warm dark brown)
        nearblack: "#2C1A12", // headings on light backgrounds
        danger: "#B02A1A", // error / urgent
        success: "#2D7A4A", // success / paid
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      spacing: {
        // 8px grid. Tailwind's default scale is already 4px-based,
        // these are convenience aliases for the 8px rhythm.
        grid: "8px",
      },
    },
  },
  plugins: [],
};
