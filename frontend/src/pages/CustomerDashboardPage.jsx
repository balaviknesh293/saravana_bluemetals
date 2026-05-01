import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/client";
import DataTable from "../components/DataTable";
import { downloadStatementCsv, printStatementPdf } from "../utils/exporters";

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

  async function fetchStatement() {
    if (!selectedCustomerId) return;
    const response = await api.get(`/reports/customer/${selectedCustomerId}`);
    return response.data.statement;
  }

  async function downloadStatementExcel() {
    try {
      const statement = await fetchStatement();
      downloadStatementCsv(statement, `customer-${selectedCustomerId}-statement`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to generate statement");
    }
  }

  async function downloadStatementPdf() {
    try {
      const statement = await fetchStatement();
      printStatementPdf(statement);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to generate statement");
    }
  }

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <label className="text-xs text-emerald-700 dark:text-emerald-300">Customer</label>
        <select className="input mt-2 max-w-md" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
          {customers.map((customer) => (
            <option key={customer.customerId} value={customer.customerId}>{customer.name}</option>
          ))}
        </select>
        <div className="mt-3 flex gap-2">
          <button type="button" className="btn-secondary" onClick={downloadStatementExcel}>Download Excel</button>
          <button type="button" className="btn-secondary" onClick={downloadStatementPdf}>Download PDF</button>
        </div>
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
