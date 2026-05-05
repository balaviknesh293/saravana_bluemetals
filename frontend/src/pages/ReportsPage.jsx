import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/client";
import DataTable from "../components/DataTable";
import { downloadReportExcel, downloadStatementCsv, printStatementPdf } from "../utils/exporters";

function ReportsPage({ type }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState([]);
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({ amount: 0, gst: 0, total: 0 });
  const [statement, setStatement] = useState(null);

  function load(options = {}) {
    const { showEmptyToast = false } = options;
    const params = new URLSearchParams();
    params.set("date", date);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    if (customerId) params.set("customerId", customerId);
    api
      .get(`/reports/${type}?${params.toString()}`)
      .then((response) => {
        const selectedCustomer = customers.find((customer) => customer.customerId === customerId);
        const customerName = selectedCustomer?.name || "All Customers";
        const nextStatement = response.data.statement
          ? { ...response.data.statement, companyName: customerName, partyName: customerName }
          : null;
        setRows(response.data.rows);
        setTotals(response.data.totals);
        setStatement(nextStatement);
        if (showEmptyToast && !response.data.rows?.length) {
          toast.error("No data found for selected filters.", { id: `report-${type}-empty` });
        }
      })
      .catch((error) => toast.error(error.response?.data?.message || "Failed to load report", { id: `report-${type}-load` }));
  }

  useEffect(() => {
    api.get("/customers").then((res) => setCustomers(res.data.customers)).catch(() => {});
    load();
  }, [type]);

  const heading = useMemo(() => `${type[0].toUpperCase()}${type.slice(1)} Report`, [type]);
  const canDeleteRows = type === "daily";
  const isDaily = type === "daily";
  const hasRows = rows.length > 0;

  async function removeSale(row) {
    const saleId = String(row?.saleId || "").trim();
    if (!saleId) {
      toast.error("Cannot delete: missing sale id.");
      return;
    }
    if (!window.confirm(`Delete sale ${saleId}?`)) return;

    try {
      await api.delete(`/sales/${encodeURIComponent(saleId)}`);
      toast.success("Sale deleted");
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete sale failed");
    }
  }

  const columns = [
    { key: "date", label: "Date" },
    { key: "type", label: "Type" },
    { key: "slipNo", label: "Slip No" },
    { key: "customerName", label: "Customer Name" },
    { key: "vehicle", label: "Vehicle No" },
    { key: "material", label: "Material" },
    { key: "quantity", label: "Quantity" },
    { key: "amount", label: "Amount" },
    { key: "gst", label: "GST" },
    { key: "total", label: "Total" },
    { key: "credit", label: "Credit" },
    { key: "debit", label: "Debit" },
    { key: "balance", label: "Balance" }
  ];

  if (canDeleteRows) {
    columns.push({
      key: "actions",
      label: "Actions",
      render: (row) => (
        <button type="button" className="btn-secondary !px-2 !py-1" onClick={() => removeSale(row)}>
          Delete
        </button>
      )
    });
  }

  return (
    <div className="space-y-4">
      <div className="glass flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{heading}</h2>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Horizontal bank-statement style export</p>
        </div>
        <div className="w-full space-y-2 md:max-w-4xl">
          <div className={`grid gap-2 ${isDaily ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
            {isDaily && (
              <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            )}
            {!isDaily && (
              <>
                <label className="block text-xs text-emerald-700 dark:text-emerald-300">
                  From
                  <input className="input mt-1 w-full" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </label>
                <label className="block text-xs text-emerald-700 dark:text-emerald-300">
                  To
                  <input className="input mt-1 w-full" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </label>
              </>
            )}
            <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">All Customers</option>
              {customers.map((customer) => (
                <option key={customer.customerId} value={customer.customerId}>{customer.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-primary" onClick={() => load({ showEmptyToast: true })}>{isDaily ? "Generate Daily Report" : "Refresh"}</button>
            <button className="btn-secondary" onClick={() => {
              if (!hasRows) {
                toast.error("No data to export.");
                return;
              }
              downloadReportExcel(rows, `${type}-report`);
            }}>Export Excel</button>
            <button className="btn-secondary" onClick={() => {
              if (!hasRows) {
                toast.error("No data to export.");
                return;
              }
              downloadStatementCsv(statement, `${type}-statement`);
            }}>Statement CSV</button>
            <button className="btn-secondary" onClick={() => {
              if (!hasRows) {
                toast.error("No data to print.");
                return;
              }
              printStatementPdf(statement);
            }}>Statement PDF/Print</button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="glass rounded-xl p-3">Amount: Rs {totals.amount}</div>
        <div className="glass rounded-xl p-3">GST: Rs {totals.gst}</div>
        <div className="glass rounded-xl p-3">Total: Rs {totals.total}</div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={["date", "slipNo", "customerName", "vehicle", "material"]}
      />
    </div>
  );
}

export default ReportsPage;
