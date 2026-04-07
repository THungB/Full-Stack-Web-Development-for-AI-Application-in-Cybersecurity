/** @type {import('tailwindcss').Config} */
const themeColor = (token) => `rgb(var(${token}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        shell: themeColor("--shell"),
        surface: themeColor("--surface"),
        panel: themeColor("--panel"),
        elevated: themeColor("--elevated"),
        "elevated-strong": themeColor("--elevated-strong"),
        line: themeColor("--line"),
        copy: themeColor("--copy"),
        muted: themeColor("--muted"),
        primary: themeColor("--primary"),
        "primary-strong": themeColor("--primary-strong"),
        "primary-soft": themeColor("--primary-soft"),
        safe: themeColor("--safe"),
        "safe-strong": themeColor("--safe-strong"),
        threat: themeColor("--threat"),
        "threat-strong": themeColor("--threat-strong"),
        warning: themeColor("--warning"),
        ink: themeColor("--ink"),
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
