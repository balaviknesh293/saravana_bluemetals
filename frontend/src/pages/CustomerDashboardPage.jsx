import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/client";
import DataTable from "../components/DataTable";

function CustomerDashboardPage() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [ledger, setLedger] = useState([]);

  useEffect(() => {
    api
      .get("/customers")
      .then((response) => {
        setCustomers(response.data.customers);
        if (response.data.customers.length) {
          setSelectedCustomerId(response.data.customers[0].customerId);
        }
      })
      .catch((error) => toast.error(error.response?.data?.message || "Failed to load customers"));
  }, []);

  useEffect(() => {
    if (!selectedCustomerId) return;
    api
      .get(`/ledger/${selectedCustomerId}`)
      .then((response) => setLedger(response.data.ledger))
      .catch((error) => toast.error(error.response?.data?.message || "Failed to load ledger"));
  }, [selectedCustomerId]);

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <label className="text-xs text-emerald-700 dark:text-emerald-300">Customer</label>
        <select className="input mt-2 max-w-md" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
          {customers.map((customer) => (
            <option key={customer.customerId} value={customer.customerId}>{customer.name}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={[
          { key: "date", label: "Date" },
          { key: "reference", label: "Reference" },
          { key: "type", label: "Type" },
          { key: "previousBalance", label: "Previous Balance" },
          { key: "credit", label: "Credit" },
          { key: "debit", label: "Debit" },
          { key: "transactionAmount", label: "Transaction Amount" },
          { key: "balance", label: "Updated Balance" }
        ]}
        rows={ledger}
        searchKeys={["date", "reference", "type", "notes"]}
      />
    </div>
  );
}

export default CustomerDashboardPage;