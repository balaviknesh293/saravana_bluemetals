import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/client";
import DataTable from "../components/DataTable";

function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);

  function load() {
    api
      .get("/materials")
      .then((response) => setMaterials(response.data.materials))
      .catch((error) => toast.error(error.response?.data?.message || "Failed to load materials"));
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(event) {
    event.preventDefault();
    try {
      if (editingId) {
        await api.put(`/materials/${editingId}`, { name, isActive: true });
        toast.success("Material updated");
      } else {
        await api.post("/materials", { name, isActive: true });
        toast.success("Material added");
      }
      setName("");
      setEditingId(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Save failed");
    }
  }

  async function remove(materialId) {
    try {
      await api.delete(`/materials/${materialId}`);
      toast.success("Material deleted");
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  }

  return (
    <div className="space-y-4">
      <form className="glass flex flex-col gap-3 rounded-2xl p-4 md:flex-row" onSubmit={submit}>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Material Name" required />
        <button className="btn-primary" type="submit">{editingId ? "Update" : "Add Material"}</button>
      </form>

      <DataTable
        columns={[
          { key: "materialId", label: "Material ID" },
          { key: "name", label: "Material" },
          { key: "isActive", label: "Status", render: (row) => (row.isActive ? "Active" : "Inactive") },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <button className="btn-secondary !px-2 !py-1" onClick={() => { setName(row.name); setEditingId(row.materialId); }}>
                  Edit
                </button>
                <button className="btn-secondary !px-2 !py-1" onClick={() => remove(row.materialId)}>
                  Delete
                </button>
              </div>
            )
          }
        ]}
        rows={materials}
        searchKeys={["materialId", "name"]}
      />
    </div>
  );
}

export default MaterialsPage;