/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/popup/**/*.{html,js,svelte,ts}'],
  theme: {
    colors: {
      blue: "#27187E",
      white: "#FFFFFF",
      orange: "#FF8600",
      lightgrey: "#F5F5F5",
      grey: "#E0E0E0",
      darkgrey: "#404040",
    },
    extend: {},
    fontFamily: {
      vollkorn: ["'Vollkorn'", "serif"],
      jetbrains: ["'JetBrains Mono'", "monospace"]
    },
    fontSize: {
      base: ["1rem", "1rem"],
      xl: ["2rem", "2rem"],
      paragraph: ["1rem", "1.25rem"],
      small: ["0.75rem", "1rem"]
    }
  },
  plugins: [],
}
