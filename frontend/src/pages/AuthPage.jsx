import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";

const initialForm = {
  name: "",
  email: "",
  password: "",
  rememberMe: false
};

function AuthPage() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialForm);

  const submitHandler = async (event) => {
    event.preventDefault();
    if (!form.email || !form.password || (!isLogin && !form.name)) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);
      if (isLogin) {
        await login(form);
      } else {
        await signup(form);
      }
      navigate("/dashboard");
    } catch (error) {
      const status = error.response?.status;
      if (!error.response) {
        toast.error("Cannot reach backend server. Make sure API is running on port 5000.");
      } else if (status === 401 && isLogin) {
        toast.error("Invalid credentials. If you are new, switch to Sign Up first.");
      } else {
        toast.error(error.response?.data?.message || "Authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
      <div className="glass w-full max-w-lg animate-fade-up rounded-3xl p-8 shadow-soft">
        <Link to="/" className="mb-6 inline-block text-sm text-teal-600 hover:underline">
          Back to home
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{isLogin ? "Welcome back" : "Create account"}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {isLogin ? "Login to continue to your dashboard." : "Start managing your items in minutes."}
        </p>

        <form onSubmit={submitHandler} className="mt-6 space-y-4">
          {!isLogin && (
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Full name"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-teal-300 focus:ring dark:border-slate-700 dark:bg-slate-900"
              minLength={2}
            />
          )}
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="Email address"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-teal-300 focus:ring dark:border-slate-700 dark:bg-slate-900"
            required
          />
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            placeholder="Password"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-teal-300 focus:ring dark:border-slate-700 dark:bg-slate-900"
            required
            minLength={8}
          />
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.rememberMe}
              onChange={(event) => setForm((prev) => ({ ...prev, rememberMe: event.target.checked }))}
              className="h-4 w-4 accent-teal-600"
            />
            Remember me
          </label>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-teal-600 px-4 py-3 font-semibold text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <button
          onClick={() => setIsLogin((prev) => !prev)}
          className="mt-4 text-sm text-slate-600 hover:underline dark:text-slate-300"
        >
          {isLogin ? "Need an account? Sign up" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
}

export default AuthPage;
