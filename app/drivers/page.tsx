"use client";

import { useEffect, useMemo, useState } from "react";
import AuthGuard from "../../components/AuthGuard";

type Driver = {
  id: string;
  name?: string;
  phone?: string;
  address?: string;
  ssnLast4?: string;
  truck?: string;
  driverType?: string;
  createdAt?: string;
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    ssnLast4: "",
    truck: "",
    driverType: "Company Driver",
  });

  async function fetchDrivers() {
    try {
      const res = await fetch("/api/drivers", { cache: "no-store" });
      const data = await res.json();
      setDrivers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch drivers error:", err);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDrivers();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm({
      name: "",
      phone: "",
      address: "",
      ssnLast4: "",
      truck: "",
      driverType: "Company Driver",
    });
  }

  function handleEdit(driver: Driver) {
    setEditingId(driver.id);
    setForm({
      name: driver.name || "",
      phone: driver.phone || "",
      address: driver.address || "",
      ssnLast4: driver.ssnLast4 || "",
      truck: driver.truck || "",
      driverType: driver.driverType || "Company Driver",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("Delete this driver?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/drivers/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Delete driver error:", text);
        alert("Failed to delete driver");
        return;
      }

      await fetchDrivers();

      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      console.error("Delete driver error:", err);
      alert("Failed to delete driver");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Driver name is required");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        ssnLast4: form.ssnLast4.trim(),
        truck: form.truck.trim(),
        driverType: form.driverType,
      };

      const url = editingId ? `/api/drivers/${editingId}` : "/api/drivers";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Save driver error:", text);
        alert(editingId ? "Failed to update driver" : "Failed to add driver");
        return;
      }

      resetForm();
      await fetchDrivers();
      alert(editingId ? "Driver updated" : "Driver added");
    } catch (err) {
      console.error("Save driver error:", err);
      alert(editingId ? "Failed to update driver" : "Failed to add driver");
    } finally {
      setSaving(false);
    }
  }

  const filteredDrivers = useMemo(() => {
    const q = search.toLowerCase();

    return drivers.filter((driver) => {
      return (
        String(driver.name || "").toLowerCase().includes(q) ||
        String(driver.phone || "").toLowerCase().includes(q) ||
        String(driver.truck || "").toLowerCase().includes(q) ||
        String(driver.driverType || "").toLowerCase().includes(q)
      );
    });
  }, [drivers, search]);

  if (loading) {
    return (
      <AuthGuard allowedRole="admin">
        <div className="p-6 text-sm text-slate-500">Loading drivers...</div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRole="admin">
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {editingId ? "Edit Driver" : "Add Driver"}
                </p>
                <h1 className="mt-2 text-2xl font-bold text-slate-900">
                  {editingId ? "Update Driver" : "New Driver"}
                </h1>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Driver Name"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                required
              />

              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Address"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                value={form.ssnLast4}
                onChange={(e) => setForm({ ...form, ssnLast4: e.target.value })}
                placeholder="Last 4 SSN"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                value={form.truck}
                onChange={(e) => setForm({ ...form, truck: e.target.value })}
                placeholder="Assigned Truck"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />

              <select
                value={form.driverType}
                onChange={(e) => setForm({ ...form, driverType: e.target.value })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option>Company Driver</option>
                <option>Owner Operator</option>
              </select>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white"
              >
                {saving
                  ? editingId
                    ? "Updating..."
                    : "Adding..."
                  : editingId
                    ? "Update Driver"
                    : "Add Driver"}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-slate-900">Drivers</h2>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search drivers..."
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm sm:max-w-xs"
              />
            </div>

            <div className="space-y-4">
              {filteredDrivers.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                  No drivers found
                </div>
              ) : (
                filteredDrivers.map((driver) => (
                  <div key={driver.id}>
                    <div className="sm:hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            {driver.name || "-"}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {driver.driverType || "-"}
                          </p>
                        </div>

                        <span className="px-2 py-1 rounded-full text-xs bg-slate-100">
                          {driver.truck || "No Truck"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-[10px] text-gray-400">Phone</p>
                          <p>{driver.phone || "-"}</p>
                        </div>

                        <div>
                          <p className="text-[10px] text-gray-400">SSN</p>
                          <p>{driver.ssnLast4 || "-"}</p>
                        </div>

                        <div>
                          <p className="text-[10px] text-gray-400">Truck</p>
                          <p>{driver.truck || "-"}</p>
                        </div>

                        <div>
                          <p className="text-[10px] text-gray-400">Date</p>
                          <p>
                            {driver.createdAt
                              ? new Date(driver.createdAt).toLocaleDateString()
                              : "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleEdit(driver)}
                          className="flex-1 bg-slate-900 text-white rounded-xl py-2 text-xs"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(driver.id)}
                          className="flex-1 bg-red-600 text-white rounded-xl py-2 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="hidden sm:block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="grid grid-cols-6 gap-4 items-center text-sm">
                        <div className="font-semibold text-slate-900">
                          {driver.name || "-"}
                        </div>
                        <div>{driver.phone || "-"}</div>
                        <div>{driver.driverType || "-"}</div>
                        <div>{driver.truck || "-"}</div>
                        <div>{driver.ssnLast4 || "-"}</div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(driver)}
                            className="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(driver.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}