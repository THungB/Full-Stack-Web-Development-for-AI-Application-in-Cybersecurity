import Navbar from "./Navbar";

export default function AppShell({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-overlay opacity-40" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-10 pt-5 sm:px-6 lg:px-8">
        <Navbar />
        <main className="mt-6 flex-1">{children}</main>
      </div>
    </div>
  );
}
