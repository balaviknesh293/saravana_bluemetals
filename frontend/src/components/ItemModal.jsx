import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const emptyForm = {
  title: "",
  description: "",
  date: "",
  status: "todo"
};

function ItemModal({ isOpen, onClose, onSubmit, initialValues, loading }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (initialValues) {
      setForm({
        title: initialValues.title,
        description: initialValues.description || "",
        date: new Date(initialValues.date).toISOString().slice(0, 10),
        status: initialValues.status
      });
    } else {
      setForm(emptyForm);
    }
  }, [initialValues, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-xl rounded-2xl p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {initialValues ? "Edit Item" : "Add New Item"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Title"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-teal-300 focus:ring dark:border-slate-700 dark:bg-slate-900"
            required
            minLength={2}
          />

          <textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Description"
            className="h-28 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-teal-300 focus:ring dark:border-slate-700 dark:bg-slate-900"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-teal-300 focus:ring dark:border-slate-700 dark:bg-slate-900"
              required
            />
            <select
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-teal-300 focus:ring dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-teal-600 px-4 py-3 font-medium text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving..." : initialValues ? "Save Changes" : "Create Item"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ItemModal;
