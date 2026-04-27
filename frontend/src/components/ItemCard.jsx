import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

const badgeStyles = {
  todo: "bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-200",
  "in-progress": "bg-sky-100 text-sky-800 dark:bg-sky-400/20 dark:text-sky-200",
  done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-200"
};

function ItemCard({ item, onEdit, onDelete }) {
  return (
    <article className="glass animate-fade-up rounded-2xl p-5 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{item.title}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Due: {new Date(item.date).toLocaleDateString()}
          </p>
        </div>
        <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold", badgeStyles[item.status])}>
          {item.status}
        </span>
      </div>

      <p className="mb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {item.description || "No description provided."}
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(item)}
          className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <PencilSquareIcon className="h-4 w-4" /> Edit
        </button>
        <button
          onClick={() => onDelete(item._id)}
          className="flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 transition hover:bg-red-100 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/70"
        >
          <TrashIcon className="h-4 w-4" /> Delete
        </button>
      </div>
    </article>
  );
}

export default ItemCard;
