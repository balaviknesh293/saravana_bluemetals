import { NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const links = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Customers", to: "/customers" },
  { label: "Customer Dashboard", to: "/customer-dashboard" },
  { label: "Vehicles", to: "/vehicles" },
  { label: "Materials", to: "/materials" },
  { label: "Sales", to: "/sales" },
  { label: "Balance", to: "/balance" },
  { label: "Daily Report", to: "/reports/daily" },
  { label: "Monthly Report", to: "/reports/monthly" },
  { label: "Access", to: "/access" }
];

function Sidebar({ onNavigate }) {
  const { logout } = useAuth();

  return (
    <aside className="glass h-full rounded-3xl p-4">
      <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">Saravana Blue Metals</h2>
      <p className="text-xs text-emerald-600 dark:text-emerald-300">Sales & Accounting ERP</p>

      <nav className="mt-6 flex flex-col gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-emerald-600 text-white"
                  : "text-emerald-800 hover:bg-emerald-50 dark:text-emerald-100 dark:hover:bg-emerald-900/60"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <button className="btn-secondary mt-4 w-full" onClick={logout}>
        Logout
      </button>
    </aside>
  );
}

export default Sidebar;