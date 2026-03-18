/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#11203b",
        mist: "#f6f3eb",
        signal: "#f97316",
        safe: "#0f766e",
        danger: "#e11d48",
        steel: "#5f6f8c",
        cloud: "#fffdf8"
      },
      boxShadow: {
        panel: "0 24px 60px rgba(17, 32, 59, 0.12)"
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(circle at top left, rgba(249,115,22,0.22), transparent 34%), radial-gradient(circle at top right, rgba(14,165,233,0.18), transparent 28%), linear-gradient(180deg, #fffdf8 0%, #f6f3eb 100%)"
      },
      fontFamily: {
        display: ['\"Space Grotesk\"', '\"Segoe UI\"', "sans-serif"],
        body: ['\"IBM Plex Sans\"', '\"Segoe UI\"', "sans-serif"]
      }
    }
  },
  plugins: []
};
