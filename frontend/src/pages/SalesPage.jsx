import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/client";

function SalesPage() {
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    slipNo: "",
    customerId: "",
    vehicleId: "",
    materialId: "",
    quantity: "",
    rate: "",
    gst: ""
  });

  useEffect(() => {
    Promise.all([api.get("/customers"), api.get("/vehicles"), api.get("/materials")])
      .then(([customerRes, vehicleRes, materialRes]) => {
        setCustomers(customerRes.data.customers);
        setVehicles(vehicleRes.data.vehicles);
        setMaterials(materialRes.data.materials.filter((item) => item.isActive));
      })
      .catch((error) => toast.error(error.response?.data?.message || "Failed to load sale form data"));
  }, []);

  const amount = useMemo(() => Number(form.quantity || 0) * Number(form.rate || 0), [form.quantity, form.rate]);
  const hasGst = form.gst !== "" && form.gst !== null && form.gst !== undefined;
  const total = amount + (hasGst ? Number(form.gst || 0) : 0);

  async function submit(event) {
    event.preventDefault();
    try {
      await api.post("/sales", {
        ...form,
        quantity: Number(form.quantity || 0),
        rate: Number(form.rate || 0),
        gst: hasGst ? Number(form.gst || 0) : null
      });
      toast.success("Sale recorded");
      setForm((current) => ({
        ...current,
        slipNo: "",
        quantity: "",
        rate: "",
        gst: ""
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save sale");
    }
  }

  return (
    <form className="glass grid gap-3 rounded-2xl p-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={submit}>
      <input className="input" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
      <input className="input" placeholder="Slip Number" value={form.slipNo} onChange={(e) => setForm((f) => ({ ...f, slipNo: e.target.value }))} required />

      <select className="input" value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))} required>
        <option value="">Select Customer</option>
        {customers.map((customer) => (
          <option key={customer.customerId} value={customer.customerId}>{customer.name}</option>
        ))}
      </select>

      <select className="input" value={form.vehicleId} onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))} required>
        <option value="">Select Vehicle</option>
        {vehicles.map((vehicle) => (
          <option key={vehicle.vehicleId} value={vehicle.vehicleId}>{vehicle.vehicleNumber}</option>
        ))}
      </select>

      <select className="input" value={form.materialId} onChange={(e) => setForm((f) => ({ ...f, materialId: e.target.value }))} required>
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

      <button className="btn-primary xl:col-span-2" type="submit">Save Sales Entry</button>
    </form>
  );
}

export default SalesPage;