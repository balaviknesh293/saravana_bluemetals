import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/client";
import DataTable from "../components/DataTable";

function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [type, setType] = useState("");
  const [editingId, setEditingId] = useState(null);

  function loadVehicles() {
    api
      .get("/vehicles")
      .then((response) => setVehicles(response.data.vehicles))
      .catch((error) => toast.error(error.response?.data?.message || "Failed to load vehicles"));
  }

  useEffect(() => {
    loadVehicles();
    api.get("/customers").then((res) => setCustomers(res.data.customers)).catch(() => {});
  }, []);

  async function submit(event) {
    event.preventDefault();
    try {
      if (editingId) {
        await api.put(`/vehicles/${editingId}`, { vehicleNumber, customerId, type });
        toast.success("Vehicle updated");
      } else {
        await api.post("/vehicles", { vehicleNumber, customerId, type });
        toast.success("Vehicle added");
      }
      setVehicleNumber("");
      setCustomerId("");
      setType("");
      setEditingId(null);
      loadVehicles();
    } catch (error) {
      toast.error(error.response?.data?.message || "Save failed");
    }
  }

  async function remove(vehicleId) {
    try {
      await api.delete(`/vehicles/${vehicleId}`);
      toast.success("Vehicle deleted");
      loadVehicles();
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || "Delete failed";
      if (status === 409) {
        const shouldCascade = window.confirm(`${message}\n\nDo you want to force delete vehicle with linked sales?`);
        if (shouldCascade) {
          await api.delete(`/vehicles/${vehicleId}?force=true`);
          toast.success("Vehicle and linked sales deleted");
          loadVehicles();
          return;
        }
      }
      toast.error(message);
    }
  }

  return (
    <div className="space-y-4">
      <form className="glass flex flex-col gap-3 rounded-2xl p-4 md:flex-row" onSubmit={submit}>
        <input className="input" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="Vehicle Number" required />
        <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">Unassigned Customer</option>
          {customers.map((customer) => (
            <option key={customer.customerId} value={customer.customerId}>{customer.name}</option>
          ))}
        </select>
        <input className="input" value={type} onChange={(e) => setType(e.target.value)} placeholder="Type (Tipper/Lorry...)" />
        <button className="btn-primary" type="submit">{editingId ? "Update" : "Add Vehicle"}</button>
      </form>

      <DataTable
        columns={[
          { key: "vehicleId", label: "Vehicle ID" },
          { key: "vehicleNumber", label: "Vehicle Number" },
          { key: "customerId", label: "Customer ID" },
          { key: "type", label: "Type" },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <button type="button" className="btn-secondary !px-2 !py-1" onClick={() => { setVehicleNumber(row.vehicleNumber); setCustomerId(row.customerId || ""); setType(row.type || ""); setEditingId(row.vehicleId); }}>
                  Edit
                </button>
                <button type="button" className="btn-secondary !px-2 !py-1" onClick={() => remove(row.vehicleId)}>
                  Delete
                </button>
              </div>
            )
          }
        ]}
        rows={vehicles}
        searchKeys={["vehicleId", "vehicleNumber", "customerId", "type"]}
      />
    </div>
  );
}

export default VehiclesPage;
