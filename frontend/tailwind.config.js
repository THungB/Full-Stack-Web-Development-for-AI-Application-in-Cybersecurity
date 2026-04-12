/** @type {import('tailwindcss').Config} */
const themeColor = (token) => `rgb(var(${token}) / <alpha-value>)`;

export default {
  darkMode: "class",
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
        panel: "0 16px 34px rgba(15, 23, 42, 0.08), 0 2px 10px rgba(15, 23, 42, 0.06)",
        glow: "0 0 22px rgba(19, 156, 84, 0.2)",
        "glow-primary": "0 0 24px rgba(58, 86, 198, 0.2)"
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
