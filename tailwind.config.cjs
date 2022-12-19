/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/popup/**/*.{html,js,svelte,ts}'],
  theme: {
    colors: {
      blue: "#27187E",
      white: "#FFFFFF",
      orange: "#FF8600",
      lightgrey: "#F5F5F5",
    },
    extend: {},
    fontFamily: {
      vollkorn: ["'Vollkorn'", "serif"],
      jetbrains: ["'JetBrains Mono'", "monospace"]
    },
    fontSize: {
      base: ["1rem", "1rem"],
      xl: ["2rem", "2rem"]
    }
  },
  plugins: [],
}
