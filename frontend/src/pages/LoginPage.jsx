import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "admin@saravanabluemetals.com", password: "" });
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      await login(form.email, form.password);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form className="glass w-full max-w-md rounded-3xl p-6" onSubmit={onSubmit}>
        <h1 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">Saravana Blue Metals</h1>
        <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">Admin Login</p>

        <div className="mt-5 space-y-3">
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="Email"
            required
          />
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="Password"
            required
          />
        </div>

        <button className="btn-primary mt-5 w-full" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;