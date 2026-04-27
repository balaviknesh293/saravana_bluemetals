import { Link, useNavigate } from "react-router-dom";
import {
  ChartBarSquareIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SunIcon,
  MoonIcon
} from "@heroicons/react/24/outline";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#99f6e4,transparent_40%),radial-gradient(circle_at_90%_10%,#fecdd3,transparent_30%)] dark:bg-[radial-gradient(circle_at_top,#0f766e,transparent_35%),radial-gradient(circle_at_90%_10%,#581c87,transparent_30%)]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">PulseBoard</h1>
        <nav className="flex items-center gap-3 text-sm">
          <Link to="/" className="rounded-lg px-3 py-2 text-slate-700 hover:bg-white/60 dark:text-slate-200">
            Home
          </Link>
          <Link
            to={isAuthenticated ? "/dashboard" : "/auth"}
            className="rounded-lg px-3 py-2 text-slate-700 hover:bg-white/60 dark:text-slate-200"
          >
            {isAuthenticated ? "Dashboard" : "Login"}
          </Link>
          <button
            onClick={toggleTheme}
            className="rounded-lg border border-slate-300/60 p-2 hover:bg-white/60 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {theme === "dark" ? (
              <SunIcon className="h-5 w-5 text-amber-300" />
            ) : (
              <MoonIcon className="h-5 w-5 text-slate-700" />
            )}
          </button>
        </nav>
      </header>

      <main className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 pb-20 pt-12 md:grid-cols-2">
        <section className="animate-fade-up space-y-6">
          <p className="inline-flex rounded-full bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:bg-slate-900/70 dark:text-teal-200">
            Smart Productivity
          </p>
          <h2 className="text-4xl font-bold leading-tight text-slate-900 dark:text-white md:text-5xl">
            Organize your work with clarity and speed.
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            PulseBoard helps teams and solo builders track items, monitor progress, and stay consistent with a
            delightful dashboard experience.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-500"
            >
              Sign Up
            </button>
            <button
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
              className="rounded-xl border border-slate-300 bg-white/70 px-6 py-3 font-semibold text-slate-800 transition hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              Get Started
            </button>
          </div>
        </section>

        <section className="glass animate-fade-up rounded-3xl p-6 shadow-soft [animation-delay:.15s]">
          <ul className="space-y-4">
            <li className="flex gap-3">
              <ShieldCheckIcon className="h-6 w-6 text-teal-600" />
              <div>
                <h3 className="font-semibold">Secure Authentication</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">JWT login with hashed passwords.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <ChartBarSquareIcon className="h-6 w-6 text-teal-600" />
              <div>
                <h3 className="font-semibold">Dashboard Analytics</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">Get quick stats for all your tasks.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <SparklesIcon className="h-6 w-6 text-teal-600" />
              <div>
                <h3 className="font-semibold">Responsive, Modern UI</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">Smooth interactions across mobile and desktop.</p>
              </div>
            </li>
          </ul>
        </section>
      </main>

      <footer className="border-t border-slate-200/60 bg-white/40 px-6 py-6 text-center text-sm text-slate-600 backdrop-blur dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
        Contact: hello@pulseboard.dev | Follow: @pulseboard
      </footer>
    </div>
  );
}

export default LandingPage;
