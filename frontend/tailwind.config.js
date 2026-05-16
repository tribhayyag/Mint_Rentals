/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F8F4EC",
        beige: "#F8F1E6",
        mint: {
          DEFAULT: "#CFEBDD",
          soft: "#DCEFE2",
          deep: "#B6E2CC",
        },
        ink: "#1F2E27",
        muted: "#6C746C",
        frame: "#E4DACB",
      },
      borderRadius: {
        "4xl": "22px",
        "5xl": "26px",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(31, 46, 39, 0.06)",
        card: "0 4px 16px rgba(31, 46, 39, 0.05)",
        lift: "0 8px 24px rgba(31, 46, 39, 0.08)",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
