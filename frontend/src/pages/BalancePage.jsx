import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/client";
import DataTable from "../components/DataTable";

function BalancePage() {
  const [customers, setCustomers] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyCustomerId, setHistoryCustomerId] = useState("");
  const [form, setForm] = useState({
    customerId: "",
    entryType: "debit",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    reference: "",
    notes: ""
  });

  function loadCustomers() {
    api
      .get("/customers")
      .then((response) => setCustomers(response.data.customers))
      .catch((error) => toast.error(error.response?.data?.message || "Failed to load balances"));
  }

  function loadHistory(customerId = "") {
    const query = customerId ? `?customerId=${encodeURIComponent(customerId)}` : "";
    api
      .get(`/ledger/all${query}`)
      .then((response) => setHistory(response.data.ledger || []))
      .catch((error) => toast.error(error.response?.data?.message || "Failed to load balance history"));
  }

  useEffect(() => {
    loadCustomers();
    loadHistory();
  }, []);

  async function submit(event) {
    event.preventDefault();
    try {
      if (form.entryType === "debit") {
        await api.post("/payment", {
          ...form,
          amount: Number(form.amount || 0)
        });
      } else {
        await api.post("/ledger/entry", {
          ...form,
          amount: Number(form.amount || 0)
        });
      }
      toast.success(`${form.entryType.toUpperCase()} recorded`);
      setForm((current) => ({ ...current, amount: "", reference: "", notes: "" }));
      loadCustomers();
      loadHistory(historyCustomerId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Payment failed");
    }
  }

  async function removeHistoryRow(ledgerId) {
    if (!window.confirm(`Delete balance history record ${ledgerId}?`)) return;
    try {
      await api.delete(`/ledger/${encodeURIComponent(ledgerId)}`);
      toast.success("Balance history record deleted");
      loadCustomers();
      loadHistory(historyCustomerId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete history record");
    }
  }

  return (
    <div className="space-y-4">
      <form className="glass grid gap-3 rounded-2xl p-4 md:grid-cols-3" onSubmit={submit}>
        <select className="input" value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))} required>
          <option value="">Select Customer</option>
          {customers.map((customer) => (
            <option key={customer.customerId} value={customer.customerId}>{customer.name}</option>
          ))}
        </select>
        <select className="input" value={form.entryType} onChange={(e) => setForm((f) => ({ ...f, entryType: e.target.value }))}>
          <option value="debit">Debit (Reduce Balance)</option>
          <option value="credit">Credit (Increase Balance)</option>
        </select>
        <input className="input" type="number" step="0.01" placeholder="Payment Amount" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required />
        <input className="input" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
        <input className="input" placeholder="Reference" value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} />
        <input className="input" placeholder="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        <button className="btn-primary" type="submit">Record Payment</button>
      </form>

      <DataTable
        columns={[
          { key: "customerId", label: "Customer ID" },
          { key: "name", label: "Name" },
          { key: "phone", label: "Phone" },
          { key: "balance", label: "Outstanding Balance" }
        ]}
        rows={customers}
        searchKeys={["customerId", "name", "phone"]}
      />

      <div className="glass space-y-3 rounded-2xl p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <h3 className="text-base font-semibold text-emerald-900 dark:text-emerald-100">Balance History</h3>
          <select
            className="input md:max-w-xs"
            value={historyCustomerId}
            onChange={(e) => {
              const next = e.target.value;
              setHistoryCustomerId(next);
              loadHistory(next);
            }}
          >
            <option value="">All Customers</option>
            {customers.map((customer) => (
              <option key={customer.customerId} value={customer.customerId}>{customer.name}</option>
            ))}
          </select>
        </div>

        <DataTable
          columns={[
            { key: "date", label: "Date" },
            { key: "ledgerId", label: "Ledger ID" },
            { key: "customerName", label: "Customer" },
            { key: "type", label: "Type" },
            { key: "reference", label: "Reference" },
            { key: "credit", label: "Credit" },
            { key: "debit", label: "Debit" },
            { key: "balance", label: "Balance" },
            { key: "notes", label: "Notes" },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <button type="button" className="btn-secondary !px-2 !py-1" onClick={() => removeHistoryRow(row.ledgerId)}>
                  Delete
                </button>
              )
            }
          ]}
          rows={history}
          searchKeys={["ledgerId", "customerName", "type", "reference", "notes", "date"]}
        />
      </div>
    </div>
  );
}

export default BalancePage;
