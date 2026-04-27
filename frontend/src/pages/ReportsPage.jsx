import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/client";
import DataTable from "../components/DataTable";
import { downloadReportExcel, downloadReportPdf } from "../utils/exporters";

function ReportsPage({ type }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({ amount: 0, gst: 0, total: 0 });

  function load() {
    api
      .get(`/reports/${type}?date=${date}`)
      .then((response) => {
        setRows(response.data.rows);
        setTotals(response.data.totals);
      })
      .catch((error) => toast.error(error.response?.data?.message || "Failed to load report"));
  }

  useEffect(() => {
    load();
  }, [type]);

  const heading = useMemo(() => `${type[0].toUpperCase()}${type.slice(1)} Report`, [type]);

  return (
    <div className="space-y-4">
      <div className="glass flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{heading}</h2>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Horizontal bank-statement style export</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="btn-secondary" onClick={load}>Refresh</button>
          <button className="btn-secondary" onClick={() => downloadReportExcel(rows, `${type}-report`)}>Export Excel</button>
          <button className="btn-secondary" onClick={() => downloadReportPdf(rows, heading)}>Export PDF</button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="glass rounded-xl p-3">Amount: Rs {totals.amount}</div>
        <div className="glass rounded-xl p-3">GST: Rs {totals.gst}</div>
        <div className="glass rounded-xl p-3">Total: Rs {totals.total}</div>
      </div>

      <DataTable
        columns={[
          { key: "date", label: "Date" },
          { key: "slipNo", label: "Slip No" },
          { key: "customerName", label: "Customer Name" },
          { key: "vehicle", label: "Vehicle No" },
          { key: "material", label: "Material" },
          { key: "quantity", label: "Quantity" },
          { key: "rate", label: "Rate" },
          { key: "amount", label: "Amount" },
          { key: "gst", label: "GST" },
          { key: "total", label: "Total" },
          { key: "balance", label: "Balance" }
        ]}
        rows={rows}
        searchKeys={["date", "slipNo", "customerName", "vehicle", "material"]}
      />
    </div>
  );
}

export default ReportsPage;