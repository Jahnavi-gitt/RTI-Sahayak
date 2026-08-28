/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FBF9F3",
        ink: "#20262B",
        teal: {
          50: "#EAF3F2",
          100: "#CFE4E1",
          400: "#2C8C86",
          600: "#0B5D5D",
          700: "#084848",
          900: "#052E2E",
        },
        marigold: {
          100: "#FCE8C6",
          400: "#F0B24C",
          500: "#E8A33D",
          600: "#C97F1F",
        },
        brick: "#B4482E",
        leaf: "#2F7A4F",
      },
      fontFamily: {
        display: ["Fraunces", "Noto Serif", "serif"],
        body: ["Noto Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        card: "18px",
      },
      boxShadow: {
        card: "0 2px 14px rgba(11, 93, 93, 0.08)",
      },
    },
  },
  plugins: [],
}
