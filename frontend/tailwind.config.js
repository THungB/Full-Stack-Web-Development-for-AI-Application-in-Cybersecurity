/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        shell: "#0b1326",
        surface: "#131b2e",
        panel: "#171f33",
        elevated: "#222a3d",
        "elevated-strong": "#2d3449",
        line: "#454652",
        copy: "#dae2fd",
        muted: "#9ea8c7",
        primary: "#bac3ff",
        "primary-strong": "#4355b9",
        "primary-soft": "#293ca0",
        safe: "#4ae176",
        "safe-strong": "#00b954",
        threat: "#ffb3ad",
        "threat-strong": "#b41521",
        warning: "#ffd66b",
        ink: "#08101f"
      },
      boxShadow: {
        panel: "0 28px 70px rgba(3, 7, 18, 0.34)",
        glow: "0 0 28px rgba(74, 225, 118, 0.14)",
        "glow-primary": "0 0 30px rgba(186, 195, 255, 0.16)"
      },
      backgroundImage: {
        "shell-radial":
          "radial-gradient(circle at top right, rgba(67, 85, 185, 0.18), transparent 24%), radial-gradient(circle at bottom left, rgba(74, 225, 118, 0.09), transparent 28%), linear-gradient(180deg, #0b1326 0%, #091120 100%)"
      },
      fontFamily: {
        display: ['"Manrope"', '"Segoe UI"', "sans-serif"],
        body: ['"Inter"', '"Segoe UI"', "sans-serif"]
      },
    }
  },
  plugins: []
};
