import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/client";
import { useAuth } from "../context/AuthContext";

function AccessPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function loadStatus() {
    try {
      setLoading(true);
      const response = await api.get("/system/storage-status");
      setStatus(response.data.status);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load storage status");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function syncToGoogle() {
    try {
      setSyncing(true);
      const response = await api.post("/system/sync-local-to-google");
      toast.success(response.data.message || "Synced to Google Sheets");
      await loadStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="glass rounded-2xl p-4">
        <h2 className="text-lg font-semibold">Access Management</h2>
        <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
          Admin-only role is active. System is ready for future role expansion.
        </p>
      </section>

      <section className="glass rounded-2xl p-4">
        <h3 className="font-semibold">Current Session</h3>
        <p className="mt-2 text-sm">Name: {user?.name}</p>
        <p className="text-sm">Email: {user?.email}</p>
        <p className="text-sm">Role: {user?.role}</p>
      </section>

      <section className="glass rounded-2xl p-4">
        <h3 className="font-semibold">Storage Status</h3>
        {loading ? <p className="mt-2 text-sm">Loading...</p> : null}
        {!loading && status ? (
          <div className="mt-2 space-y-1 text-sm">
            <p>Mode: {status.mode}</p>
            <p>Google Configured: {String(status.googleConfigured)}</p>
            <p>Google Connected: {String(status.googleConnected)}</p>
            <p>Spreadsheet ID: {status.spreadsheetId || "Not set"}</p>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={loadStatus}>Refresh Status</button>
          <button className="btn-primary" onClick={syncToGoogle} disabled={syncing}>
            {syncing ? "Syncing..." : "Sync Local Data to Google Sheets"}
          </button>
        </div>
      </section>

      <section className="glass rounded-2xl p-4">
        <h3 className="font-semibold">Security Checklist</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-800 dark:text-emerald-200">
          <li>JWT token required on all protected routes.</li>
          <li>Use bcrypt hash in `ADMIN_PASSWORD_HASH` for production.</li>
          <li>Grant service account only spreadsheet-specific access.</li>
        </ul>
      </section>
    </div>
  );
}

export default AccessPage;