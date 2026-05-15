/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: [
          "Inter",
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        serif: ["New York", "Iowan Old Style", "Georgia", "serif"],
      },
      boxShadow: {
        island: "0 18px 55px rgba(0, 0, 0, 0.18), 0 3px 14px rgba(0, 0, 0, 0.12)",
      },
    },
  },
  plugins: [],
};
