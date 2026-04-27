import { Outlet } from "react-router-dom";
import { useState } from "react";

import Sidebar from "./Sidebar";
import { useTheme } from "../context/ThemeContext";

function AppShell() {
  const [open, setOpen] = useState(false);
  const { darkMode, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen p-3 md:p-6">
      <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-[270px_1fr]">
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <div className="space-y-4">
          <header className="glass flex items-center justify-between rounded-2xl px-4 py-3">
            <button className="btn-secondary md:hidden" onClick={() => setOpen((value) => !value)}>
              Menu
            </button>
            <h1 className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Admin Control Panel
            </h1>
            <button className="btn-secondary" onClick={toggleTheme}>
              {darkMode ? "Light" : "Dark"}
            </button>
          </header>

          {open ? (
            <div className="md:hidden">
              <Sidebar onNavigate={() => setOpen(false)} />
            </div>
          ) : null}

          <main className="space-y-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppShell;