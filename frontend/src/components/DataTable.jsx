import { useMemo, useState } from "react";

function DataTable({ columns, rows, searchKeys = [] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((row) =>
      searchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(normalized))
    );
  }, [rows, searchKeys, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          className="input md:max-w-xs"
          placeholder="Search..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <p className="text-xs text-emerald-700 dark:text-emerald-300">Rows: {filtered.length}</p>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="border-b border-emerald-100 px-3 py-2 text-left text-xs text-emerald-700 dark:border-emerald-900 dark:text-emerald-300">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, rowIndex) => (
              <tr key={`${rowIndex}-${row.id || rowIndex}`} className="border-b border-emerald-50 dark:border-emerald-900/50">
                {columns.map((column) => (
                  <td key={column.key} className="px-3 py-2 text-emerald-900 dark:text-emerald-100">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
            {!paginated.length ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-emerald-700 dark:text-emerald-300">
                  No records found
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 text-xs">
        <button
          className="btn-secondary"
          disabled={currentPage <= 1}
          onClick={() => setPage((value) => Math.max(1, value - 1))}
        >
          Prev
        </button>
        <span className="px-2 text-emerald-700 dark:text-emerald-300">
          {currentPage} / {pageCount}
        </span>
        <button
          className="btn-secondary"
          disabled={currentPage >= pageCount}
          onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default DataTable;