import { useState } from "react";
import {
  Bell,
  ClockCounterClockwise,
  GearSix,
  List,
  MagnifyingGlass,
  Question,
  Scan,
  ShieldCheckered,
  SignOut,
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

function NavItem({ item, mobile = false, onClick }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={onClick}
      className={({ isActive }) =>
        [
          "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
          mobile ? "justify-center" : "",
          isActive
            ? "bg-primary-strong/25 text-primary shadow-glow-primary"
            : "text-copy/60 hover:bg-primary-strong/10 hover:text-copy",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={mobile ? 20 : 18}
            weight={isActive ? "fill" : "regular"}
            className={isActive ? "text-primary" : "text-copy/70"}
          />
          <span className={mobile ? "text-[11px] font-semibold uppercase tracking-[0.18em]" : ""}>
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const placeholder = searchCopy[location.pathname] || searchCopy["/"];

  return (
    <div className="relative min-h-screen overflow-hidden bg-shell text-copy">
      <div className="pointer-events-none fixed inset-0 grid-overlay opacity-30" />
      <div className="pointer-events-none fixed left-[-10%] top-[65%] h-[28rem] w-[28rem] rounded-full bg-safe/6 blur-[140px]" />
      <div className="pointer-events-none fixed right-[-8%] top-[-8%] h-[32rem] w-[32rem] rounded-full bg-primary-strong/12 blur-[150px]" />

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line/15 bg-shell/95 px-4 py-8 lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-strong text-primary shadow-glow-primary">
            <ShieldCheckered size={24} weight="fill" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-primary">
              Aegis Sentinel
            </h1>
            <p className="mt-1 text-[10px] uppercase tracking-[0.26em] text-copy/40">
              Threat Intelligence
            </p>
          </div>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {primaryNav.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </nav>

        <NavLink
          to="/scan"
          className="btn-primary-dark mt-6 rounded-xl px-4 py-3 shadow-glow-primary"
        >
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
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-copy/60 transition hover:bg-primary-strong/10 hover:text-copy"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="relative min-h-screen lg:pl-64">
        <header className="sticky top-0 z-50 border-b border-line/10 bg-shell/80 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-[1600px] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="btn-secondary-dark h-11 w-11 rounded-xl px-0 lg:hidden"
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setMobileOpen((value) => !value)}
            >
              {mobileOpen ? <X size={18} /> : <List size={18} />}
            </button>

            <div className="min-w-0 lg:hidden">
              <p className="font-display text-lg font-extrabold text-primary">
                Aegis Sentinel
              </p>
            </div>

            <div className="hidden flex-1 sm:block">
              <label className="relative block">
                <MagnifyingGlass
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="text"
                  readOnly
                  aria-label="Search"
                  placeholder={placeholder}
                  className="field-dark h-11 rounded-xl pl-10 pr-4"
                />
              </label>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                className="btn-secondary-dark h-11 w-11 rounded-xl px-0"
                aria-label="Notifications"
              >
                <Bell size={18} />
              </button>
              <button
                type="button"
                className="btn-secondary-dark hidden h-11 w-11 rounded-xl px-0 sm:inline-flex"
                aria-label="Help"
              >
                <Question size={18} />
              </button>
              <button
                type="button"
                className="btn-secondary-dark h-11 w-11 rounded-xl px-0"
                aria-label="Settings"
              >
                <GearSix size={18} />
              </button>
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-line/20 bg-elevated-strong text-sm font-bold text-primary">
                AS
              </div>
            </div>
          </div>

          {mobileOpen ? (
            <div className="border-t border-line/10 px-4 py-4 lg:hidden">
              <div className="flex flex-col gap-2">
                {primaryNav.map((item) => (
                  <NavItem
                    key={item.to}
                    item={item}
                    onClick={() => setMobileOpen(false)}
                  />
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

        <main className="mx-auto w-full max-w-[1600px] px-4 pb-24 pt-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-line/10 bg-shell/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2">
          {primaryNav.map((item) => (
            <NavItem key={`mobile-${item.to}`} item={item} mobile />
          ))}
        </div>
      </nav>
    </div>
  );
}
