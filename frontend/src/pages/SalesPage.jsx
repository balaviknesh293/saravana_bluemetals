import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/client";
import DataTable from "../components/DataTable";

function SalesPage() {
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [sales, setSales] = useState([]);
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [editingSaleId, setEditingSaleId] = useState(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    transactionType: "sale",
    slipNo: "",
    customerId: "",
    vehicleId: "",
    materialId: "",
    quantity: "",
    rate: "",
    gst: ""
  });

  function loadSales() {
    api
      .get("/sales")
      .then((response) => setSales(response.data.sales))
      .catch((error) => toast.error(error.response?.data?.message || "Failed to load sales", { id: "sales-load-error" }));
  }

  useEffect(() => {
    Promise.all([api.get("/customers"), api.get("/vehicles"), api.get("/materials")])
      .then(([customerRes, vehicleRes, materialRes]) => {
        setCustomers(customerRes.data.customers);
        setVehicles(vehicleRes.data.vehicles);
        setMaterials(materialRes.data.materials.filter((item) => item.isActive));
      })
      .catch((error) => toast.error(error.response?.data?.message || "Failed to load sale form data", { id: "sales-form-load-error" }));
    loadSales();
  }, []);

  const amount = useMemo(() => Number(form.quantity || 0) * Number(form.rate || 0), [form.quantity, form.rate]);
  const hasGst = form.gst !== "" && form.gst !== null && form.gst !== undefined;
  const total = amount + (hasGst ? Number(form.gst || 0) : 0);
  const filteredVehicles = useMemo(
    () =>
      vehicles.filter((vehicle) => {
        const allowedForCustomer = !form.customerId || !vehicle.customerId || vehicle.customerId === form.customerId;
        if (!allowedForCustomer) return false;
        if (!vehicleQuery.trim()) return true;
        return String(vehicle.vehicleNumber || "").toLowerCase().includes(vehicleQuery.toLowerCase().trim());
      }),
    [vehicles, form.customerId, vehicleQuery]
  );

  function onVehicleInputChange(value) {
    setVehicleQuery(value);
    const exact = filteredVehicles.find(
      (vehicle) => String(vehicle.vehicleNumber || "").toLowerCase() === String(value || "").toLowerCase()
    );
    setForm((current) => ({ ...current, vehicleId: exact?.vehicleId || "" }));
  }

  async function submit(event) {
    event.preventDefault();
    if (form.transactionType === "sale" && (!form.vehicleId || !form.materialId)) {
      toast.error("Vehicle and Material are required for Sale");
      return;
    }
    if (form.transactionType === "purchase" && !form.materialId) {
      toast.error("Select material for Purchase");
      return;
    }

    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity || 0),
        rate: Number(form.rate || 0),
        gst: hasGst ? Number(form.gst || 0) : null
      };
      if (editingSaleId) {
        await api.put(`/sales/${editingSaleId}`, payload);
      } else {
        await api.post("/sales", payload);
      }
      toast.success(editingSaleId ? "Sale updated" : form.transactionType === "sale" ? "Sale recorded" : "Purchase recorded");
      setForm((current) => ({
        ...current,
        slipNo: "",
        quantity: "",
        rate: "",
        gst: ""
      }));
      setEditingSaleId(null);
      loadSales();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save sale");
    }
  }

  async function removeSale(saleId) {
    if (!window.confirm(`Delete sale ${saleId}?`)) return;
    try {
      await api.delete(`/sales/${saleId}`);
      toast.success("Sale deleted");
      loadSales();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete sale failed");
    }
  }

  return (
    <div className="space-y-4">
      <form className="glass grid gap-3 rounded-2xl p-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={submit}>
        <input className="input" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
        <select className="input" value={form.transactionType} onChange={(e) => setForm((f) => ({ ...f, transactionType: e.target.value }))}>
          <option value="sale">Sale</option>
          <option value="purchase">Purchase</option>
        </select>
        <input className="input" placeholder="Slip Number" value={form.slipNo} onChange={(e) => setForm((f) => ({ ...f, slipNo: e.target.value }))} required />

        <select className="input" value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))} required>
          <option value="">Select Customer</option>
          {customers.map((customer) => (
            <option key={customer.customerId} value={customer.customerId}>{customer.name}</option>
          ))}
        </select>

        <input
          className="input"
          placeholder="Type Vehicle Number"
          value={vehicleQuery}
          onChange={(e) => onVehicleInputChange(e.target.value)}
          list="vehicle-suggestions"
          required={form.transactionType === "sale"}
        />
        <datalist id="vehicle-suggestions">
          {filteredVehicles.map((vehicle) => (
            <option key={vehicle.vehicleId} value={vehicle.vehicleNumber} />
          ))}
        </datalist>

        <select
          className="input"
          value={form.materialId}
          onChange={(e) => {
            const nextMaterialId = e.target.value;
            const selectedMaterial = materials.find((item) => item.materialId === nextMaterialId);
            setForm((current) => ({
              ...current,
              materialId: nextMaterialId,
              rate: selectedMaterial && Number(selectedMaterial.price || 0) > 0 ? String(selectedMaterial.price) : current.rate
            }));
          }}
          required={form.transactionType === "sale"}
        >
          <option value="">Select Material</option>
          {materials.map((material) => (
            <option key={material.materialId} value={material.materialId}>{material.name}</option>
          ))}
        </select>

        <input className="input" type="number" step="0.01" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} required />
        <input className="input" type="number" step="0.01" placeholder="Rate per Unit" value={form.rate} onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))} required />
        <input className="input" type="number" step="0.01" placeholder="GST (Optional)" value={form.gst} onChange={(e) => setForm((f) => ({ ...f, gst: e.target.value }))} />

        <div className="glass rounded-xl p-3">
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Amount</p>
          <p className="text-lg font-semibold">Rs {amount.toFixed(2)}</p>
        </div>

        <div className="glass rounded-xl p-3">
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Total (Amount + GST)</p>
          <p className="text-lg font-semibold">Rs {total.toFixed(2)}</p>
        </div>

        <button className="btn-primary xl:col-span-2" type="submit">
          {editingSaleId ? "Update Sales Entry" : form.transactionType === "sale" ? "Save Sales Entry" : "Save Purchase Entry"}
        </button>
      </form>

      <DataTable
        columns={[
          { key: "saleId", label: "Sale ID" },
          { key: "date", label: "Date" },
          { key: "type", label: "Type" },
          { key: "slipNo", label: "Slip No" },
          { key: "customerName", label: "Customer" },
          { key: "vehicle", label: "Vehicle Number" },
          { key: "product", label: "Product" },
          { key: "quantity", label: "Qty" },
          { key: "rate", label: "Rate" },
          { key: "total", label: "Total" },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <button type="button" className="btn-secondary !px-2 !py-1" onClick={() => {
                  setEditingSaleId(row.saleId);
                  setForm((current) => ({
                    ...current,
                    date: row.date,
                    transactionType: String(row.type || "SALE").toLowerCase(),
                    slipNo: row.slipNo || "",
                    customerId: row.customerId || "",
                    vehicleId: vehicles.find((v) => v.vehicleNumber === row.vehicle)?.vehicleId || "",
                    materialId: materials.find((m) => m.name === row.material)?.materialId || "",
                    quantity: String(row.quantity ?? ""),
                    rate: String(row.rate ?? ""),
                    gst: row.gst === null || row.gst === undefined ? "" : String(row.gst)
                  }));
                  setVehicleQuery(row.vehicle || "");
                }}>
                  Edit
                </button>
                <button type="button" className="btn-secondary !px-2 !py-1" onClick={() => removeSale(row.saleId)}>
                  Delete
                </button>
              </div>
            )
          }
        ]}
        rows={sales}
        searchKeys={["saleId", "date", "slipNo", "customerName", "product", "material", "vehicle"]}
      />
    </div>
  );
}

export default SalesPage;
