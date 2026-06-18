/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EEEDF9",
          100: "#D4D2F1",
          200: "#AAA6E3",
          300: "#7F79D5",
          400: "#6B64C9",
          500: "#534AB7",
          600: "#453DA0",
          700: "#383284",
          800: "#2B2768",
          900: "#1E1C4C",
        },
      },
    },
  },
  plugins: [],
};
