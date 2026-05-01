import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/client";
import DataTable from "../components/DataTable";

function BalancePage() {
  const [customers, setCustomers] = useState([]);
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

  useEffect(() => {
    loadCustomers();
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
    } catch (error) {
      toast.error(error.response?.data?.message || "Payment failed");
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
    </div>
  );
}

export default BalancePage;
