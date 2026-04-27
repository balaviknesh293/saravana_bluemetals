import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/client";
import StatCard from "../components/StatCard";

function DashboardPage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then((response) => setSummary(response.data))
      .catch((error) => toast.error(error.response?.data?.message || "Failed to load dashboard"));
  }, []);

  const bars = summary?.revenueByDay || [];
  const max = bars.length ? Math.max(...bars.map((item) => item.revenue)) : 1;

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-3">
        <StatCard title="Daily Revenue" value={`Rs ${summary?.dailyRevenue ?? 0}`} />
        <StatCard title="Total Sales" value={`Rs ${summary?.totalSales ?? 0}`} />
        <StatCard title="Outstanding Balance" value={`Rs ${summary?.outstandingBalance ?? 0}`} />
      </section>

      <section className="glass rounded-2xl p-4">
        <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">Last 14 Days Revenue</h2>
        <div className="mt-4 grid grid-cols-7 gap-2 sm:grid-cols-14">
          {bars.map((bar) => (
            <div key={bar.date} className="flex flex-col items-center gap-1">
              <div className="flex h-28 w-full items-end rounded bg-emerald-100 px-1 dark:bg-emerald-900/60">
                <div
                  className="w-full rounded bg-emerald-500"
                  style={{ height: `${Math.max(8, (bar.revenue / max) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300">{bar.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;