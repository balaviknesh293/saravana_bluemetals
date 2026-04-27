/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 18px 40px -18px rgba(0, 0, 0, 0.35)"
      },
      animation: {
        "fade-up": "fadeUp .5s ease-out both",
        "pulse-soft": "pulseSoft 1.8s ease-in-out infinite"
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseSoft: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: ".55" }
        }
      }
    }
  },
  plugins: []
};
