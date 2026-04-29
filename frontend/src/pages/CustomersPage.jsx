import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/client";
import DataTable from "../components/DataTable";

const initialForm = { name: "", phone: "", address: "", balance: "0" };

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const loadedRef = useRef(false);

  function loadCustomers() {
    api
      .get("/customers")
      .then((response) => setCustomers(response.data.customers))
      .catch((error) => toast.error(error.response?.data?.message || "Failed to load customers", { id: "customers-load-error" }));
  }

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadCustomers();
  }, []);

  async function submit(event) {
    event.preventDefault();
    try {
      if (editingId) {
        await api.put(`/customers/${editingId}`, { ...form, balance: Number(form.balance || 0) });
        toast.success("Customer updated");
      } else {
        await api.post("/customers", { ...form, balance: Number(form.balance || 0) });
        toast.success("Customer created");
      }
      setForm(initialForm);
      setEditingId(null);
      loadCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Save failed");
    }
  }

  async function remove(customerId) {
    try {
      await api.delete(`/customers/${customerId}`);
      toast.success("Customer deleted");
      loadCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  }

  async function adjustBalance(customerId, entryType) {
    const amountRaw = window.prompt(`Enter ${entryType} amount`);
    if (amountRaw === null) return;
    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    const notes = window.prompt("Optional notes") || "";

    try {
      await api.post("/ledger/entry", {
        customerId,
        amount,
        entryType,
        notes,
        reference: `CUSTOMER_${entryType.toUpperCase()}`
      });
      toast.success(`${entryType[0].toUpperCase()}${entryType.slice(1)} recorded`);
      loadCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to record transaction");
    }
  }

  return (
    <div className="space-y-4">
      <form className="glass grid gap-3 rounded-2xl p-4 md:grid-cols-5" onSubmit={submit}>
        <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        <input className="input" placeholder="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        <input className="input" type="number" step="0.01" placeholder="Opening Balance" value={form.balance} onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))} />
        <button className="btn-primary" type="submit">{editingId ? "Update Customer" : "Add Customer"}</button>
      </form>

      <DataTable
        columns={[
          { key: "customerId", label: "Customer ID" },
          { key: "name", label: "Name" },
          { key: "phone", label: "Phone" },
          { key: "address", label: "Address" },
          { key: "balance", label: "Balance" },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary !px-2 !py-1"
                  onClick={() => {
                    setForm({
                      name: row.name,
                      phone: row.phone,
                      address: row.address,
                      balance: String(row.balance)
                    });
                    setEditingId(row.customerId);
                  }}
                >
                  Edit
                </button>
                <button type="button" className="btn-secondary !px-2 !py-1" onClick={() => remove(row.customerId)}>
                  Delete
                </button>
                <button type="button" className="btn-secondary !px-2 !py-1" onClick={() => adjustBalance(row.customerId, "credit")}>
                  Credit
                </button>
                <button type="button" className="btn-secondary !px-2 !py-1" onClick={() => adjustBalance(row.customerId, "debit")}>
                  Debit
                </button>
              </div>
            )
          }
        ]}
        rows={customers}
        searchKeys={["customerId", "name", "phone", "address"]}
      />
    </div>
  );
}

export default CustomersPage;
