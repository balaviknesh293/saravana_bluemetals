import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/client";
import DataTable from "../components/DataTable";

function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [editingId, setEditingId] = useState(null);

  function loadVehicles() {
    api
      .get("/vehicles")
      .then((response) => setVehicles(response.data.vehicles))
      .catch((error) => toast.error(error.response?.data?.message || "Failed to load vehicles"));
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  async function submit(event) {
    event.preventDefault();
    try {
      if (editingId) {
        await api.put(`/vehicles/${editingId}`, { vehicleNumber });
        toast.success("Vehicle updated");
      } else {
        await api.post("/vehicles", { vehicleNumber });
        toast.success("Vehicle added");
      }
      setVehicleNumber("");
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
      toast.error(error.response?.data?.message || "Delete failed");
    }
  }

  return (
    <div className="space-y-4">
      <form className="glass flex flex-col gap-3 rounded-2xl p-4 md:flex-row" onSubmit={submit}>
        <input className="input" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="Vehicle Number" required />
        <button className="btn-primary" type="submit">{editingId ? "Update" : "Add Vehicle"}</button>
      </form>

      <DataTable
        columns={[
          { key: "vehicleId", label: "Vehicle ID" },
          { key: "vehicleNumber", label: "Vehicle Number" },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <button type="button" className="btn-secondary !px-2 !py-1" onClick={() => { setVehicleNumber(row.vehicleNumber); setEditingId(row.vehicleId); }}>
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
        searchKeys={["vehicleId", "vehicleNumber"]}
      />
    </div>
  );
}

export default VehiclesPage;
