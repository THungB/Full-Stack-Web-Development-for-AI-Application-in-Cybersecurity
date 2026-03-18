import { useState } from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/" },
  { label: "Scan", to: "/scan" },
  { label: "History", to: "/history" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="panel sticky top-5 z-40 overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-5 py-4 lg:px-6">
        <div>
          <p className="section-kicker">Spam Detection System</p>
          <div className="mt-2">
            <h1 className="text-xl font-bold sm:text-2xl">Cybersecurity Console</h1>
            <p className="mt-1 text-sm text-steel">
              Monitor scans from website, OCR, Telegram, browser extension, and
              batch CSV testing in one place.
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label="Toggle navigation menu"
          onClick={() => setOpen((value) => !value)}
          className="btn-secondary px-4 py-2 lg:hidden"
        >
          Menu
        </button>

        <nav className="hidden items-center gap-2 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-ink text-white"
                    : "text-ink hover:bg-white hover:text-signal"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {open ? (
        <nav className="border-t border-ink/10 px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-ink text-white"
                      : "bg-white/70 text-ink hover:text-signal"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
