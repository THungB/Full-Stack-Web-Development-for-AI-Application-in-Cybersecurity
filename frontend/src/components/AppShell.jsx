import { useEffect, useState } from "react";
import {
  Bell,
  ClockCounterClockwise,
  GearSix,
  List,
  MagnifyingGlass,
  Moon,
  Question,
  Scan,
  ShieldCheckered,
  SignOut,
  Sun,
  SquaresFour,
  X,
} from "@phosphor-icons/react";
import { NavLink, useLocation } from "react-router-dom";

const primaryNav = [
  { label: "Dashboard", to: "/", icon: SquaresFour },
  { label: "Scan", to: "/scan", icon: Scan },
  { label: "History", to: "/history", icon: ClockCounterClockwise },
];

const utilityNav = [
  { label: "Support", icon: Question },
  { label: "Logout", icon: SignOut },
];

const searchCopy = {
  "/": "Search signals, IPs, or threat actors...",
  "/scan": "Search detection playbooks or active scans...",
  "/history": "Search records...",
};

const THEME_STORAGE_KEY = "ui-theme";

function NavItem({ item, mobile = false, onClick }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={onClick}
      className={({ isActive }) =>
        [
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition duration-200",
          mobile ? "justify-center" : "",
          isActive
            ? "bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm"
            : "text-copy/65 hover:bg-elevated hover:text-copy",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={mobile ? 19 : 17}
            weight={isActive ? "fill" : "regular"}
            className={isActive ? "text-primary" : "text-copy/65"}
          />
          <span className={mobile ? "text-[11px] uppercase tracking-[0.16em]" : ""}>
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark"
      ? "dark"
      : "light";
  });
  const location = useLocation();
  const placeholder = searchCopy[location.pathname] || searchCopy["/"];
  const isDark = theme === "dark";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("theme-dark", isDark);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [isDark, theme]);

  const iconButtonClass =
    "btn-secondary-dark h-10 w-10 rounded-xl border-line/35 px-0";

  return (
    <div className="relative min-h-screen overflow-hidden bg-shell text-copy">
      <div className="pointer-events-none fixed inset-0 grid-overlay opacity-50" />
      <div className="pointer-events-none fixed right-[-12%] top-[-14%] h-[26rem] w-[26rem] rounded-full bg-primary/12 blur-[140px]" />
      <div className="pointer-events-none fixed left-[-16%] top-[68%] h-[20rem] w-[20rem] rounded-full bg-safe/10 blur-[120px]" />

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line/25 bg-shell/90 px-4 py-7 backdrop-blur-xl lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <ShieldCheckered size={22} weight="fill" />
          </div>
          <div>
            <h1 className="text-[1.7rem] font-extrabold tracking-tight text-primary">
              Tech Nova
            </h1>
            <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-copy/45">
              Spam Detector
            </p>
          </div>
        </div>

        <nav className="mt-7 flex flex-col gap-1.5">
          {primaryNav.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </nav>

        <NavLink to="/scan" className="btn-primary-dark mt-5 rounded-xl px-4 py-2.5">
          <Scan size={18} weight="bold" />
          <span>New Scan</span>
        </NavLink>

        <div className="mt-auto flex flex-col gap-1 pt-8">
          {utilityNav.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                type="button"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-copy/65 transition duration-200 hover:bg-elevated hover:text-copy"
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="relative min-h-screen lg:pl-64">
        <header className="sticky top-0 z-50 border-b border-line/25 bg-shell/88 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <button
              type="button"
              className={`${iconButtonClass} lg:hidden`}
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setMobileOpen((value) => !value)}
            >
              {mobileOpen ? <X size={18} /> : <List size={18} />}
            </button>

            <div className="min-w-0 lg:hidden">
              <p className="font-display text-lg font-extrabold text-primary">
                Tech Nova
              </p>
            </div>

            <div className="hidden flex-1 sm:block">
              <label className="relative block">
                <MagnifyingGlass
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="text"
                  readOnly
                  aria-label="Search"
                  placeholder={placeholder}
                  className="field-dark h-10 rounded-xl pl-10 pr-4"
                />
              </label>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button type="button" className={iconButtonClass} aria-label="Notifications">
                <Bell size={17} />
              </button>
              <button
                type="button"
                className={`${iconButtonClass} hidden sm:inline-flex`}
                aria-label="Help"
              >
                <Question size={17} />
              </button>
              <button type="button" className={iconButtonClass} aria-label="Settings">
                <GearSix size={17} />
              </button>
              <button
                type="button"
                className={iconButtonClass}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
              >
                {isDark ? <Sun size={17} weight="fill" /> : <Moon size={17} weight="fill" />}
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-xs font-bold text-primary">
                AS
              </div>
            </div>
          </div>

          {mobileOpen ? (
            <div className="border-t border-line/20 px-4 py-4 lg:hidden">
              <div className="flex flex-col gap-2">
                {primaryNav.map((item) => (
                  <NavItem key={item.to} item={item} onClick={() => setMobileOpen(false)} />
                ))}
                <NavLink
                  to="/scan"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary-dark mt-2 rounded-xl"
                >
                  <Scan size={18} weight="bold" />
                  <span>New Scan</span>
                </NavLink>
              </div>
            </div>
          ) : null}
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 pb-24 pt-5 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-line/25 bg-shell/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2">
          {primaryNav.map((item) => (
            <NavItem key={`mobile-${item.to}`} item={item} mobile />
          ))}
        </div>
      </nav>
    </div>
  );
}
