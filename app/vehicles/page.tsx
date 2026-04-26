"use client";

import { useEffect, useMemo, useState } from "react";

type Vehicle = {
  id: string;
  unitNumber?: string;
  make?: string;
  model?: string;
  year?: string | number;
  vin?: string;
  plateNumber?: string;
  state?: string;
  type?: string;
  status?: string;
  driver?: string;
  createdAt?: string;
  updatedAt?: string;
};

function niceDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [form, setForm] = useState({
    unitNumber: "",
    make: "",
    model: "",
    year: "",
    vin: "",
    plateNumber: "",
    state: "",
    type: "Truck",
    status: "Active",
    driver: "",
  });

  async function fetchVehicles() {
    try {
      const res = await fetch("/api/vehicles");
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Vehicles fetch error:", error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVehicles();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm({
      unitNumber: "",
      make: "",
      model: "",
      year: "",
      vin: "",
      plateNumber: "",
      state: "",
      type: "Truck",
      status: "Active",
      driver: "",
    });
  }

  function handleEdit(vehicle: Vehicle) {
    setEditingId(vehicle.id);
    setForm({
      unitNumber: vehicle.unitNumber || "",
      make: vehicle.make || "",
      model: vehicle.model || "",
      year: String(vehicle.year || ""),
      vin: vehicle.vin || "",
      plateNumber: vehicle.plateNumber || "",
      state: vehicle.state || "",
      type: vehicle.type || "Truck",
      status: vehicle.status || "Active",
      driver: vehicle.driver || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("Delete this vehicle?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("Failed to delete vehicle");
        return;
      }

      if (editingId === id) resetForm();
      await fetchVehicles();
    } catch (error) {
      console.error("Vehicle delete error:", error);
      alert("Failed to delete vehicle");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        unitNumber: form.unitNumber || null,
        make: form.make || null,
        model: form.model || null,
        year: form.year || null,
        vin: form.vin || null,
        plateNumber: form.plateNumber || null,
        state: form.state || null,
        type: form.type || null,
        status: form.status || null,
        driver: form.driver || null,
      };

      const url = editingId ? `/api/vehicles/${editingId}` : "/api/vehicles";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Vehicle save error:", text);
        alert(editingId ? "Failed to update vehicle" : "Failed to save vehicle");
        return;
      }

      resetForm();
      await fetchVehicles();
    } catch (error) {
      console.error("Vehicle save error:", error);
      alert(editingId ? "Failed to update vehicle" : "Failed to save vehicle");
    } finally {
      setSaving(false);
    }
  }

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const q = search.toLowerCase();

      const matchesSearch =
        String(vehicle.unitNumber || "").toLowerCase().includes(q) ||
        String(vehicle.make || "").toLowerCase().includes(q) ||
        String(vehicle.model || "").toLowerCase().includes(q) ||
        String(vehicle.vin || "").toLowerCase().includes(q) ||
        String(vehicle.plateNumber || "").toLowerCase().includes(q) ||
        String(vehicle.driver || "").toLowerCase().includes(q) ||
        String(vehicle.type || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "All" ||
        String(vehicle.status || "").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [vehicles, search, statusFilter]);

  const activeCount = useMemo(() => {
    return vehicles.filter(
      (v) => String(v.status || "").toLowerCase() === "active"
    ).length;
  }, [vehicles]);

  const inactiveCount = useMemo(() => {
    return vehicles.filter(
      (v) => String(v.status || "").toLowerCase() === "inactive"
    ).length;
  }, [vehicles]);

  const maintenanceCount = useMemo(() => {
    return vehicles.filter(
      (v) => String(v.status || "").toLowerCase() === "maintenance"
    ).length;
  }, [vehicles]);

  function statusBadge(status?: string) {
    const s = String(status || "").toLowerCase();
    if (s === "active") return "bg-emerald-100 text-emerald-700";
    if (s === "inactive") return "bg-slate-200 text-slate-700";
    if (s === "maintenance") return "bg-amber-100 text-amber-700";
    return "bg-slate-100 text-slate-700";
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-teal-950 p-8 text-white shadow-xl xl:col-span-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-200">
            Fleet Management
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Enterprise vehicle center
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Track trucks, vans, plates, VINs, assigned drivers, and fleet status in one place.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active</p>
              <p className="mt-2 text-2xl font-bold">{activeCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Inactive</p>
              <p className="mt-2 text-2xl font-bold">{inactiveCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Maintenance</p>
              <p className="mt-2 text-2xl font-bold">{maintenanceCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Search & Filter
          </p>

          <div className="mt-5 space-y-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search unit, VIN, plate, driver..."
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:bg-white"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:bg-white"
            >
              <option>All</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>Maintenance</option>
            </select>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Results
          </p>

          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Filtered Vehicles</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {filteredVehicles.length}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Fleet Status</p>
              <p className="mt-2 text-lg font-bold text-slate-900">Ready</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                {editingId ? "Edit Vehicle" : "Add Vehicle"}
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                {editingId ? "Update Vehicle" : "New Vehicle"}
              </h2>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              value={form.unitNumber}
              onChange={(e) => setForm({ ...form, unitNumber: e.target.value })}
              placeholder="Unit Number"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-500"
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <input
                value={form.make}
                onChange={(e) => setForm({ ...form, make: e.target.value })}
                placeholder="Make"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-500"
              />
              <input
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="Model"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-500"
              />
            </div>

            <input
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              placeholder="Year"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-500"
            />

            <input
              value={form.vin}
              onChange={(e) => setForm({ ...form, vin: e.target.value })}
              placeholder="VIN"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-500"
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <input
                value={form.plateNumber}
                onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
                placeholder="Plate Number"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-500"
              />
              <input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                placeholder="Plate State"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-500"
              />
            </div>

            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-500"
            >
              <option>Truck</option>
              <option>Trailer</option>
              <option>Van</option>
              <option>Box Truck</option>
              <option>Sprinter Van</option>
            </select>

            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-500"
            >
              <option>Active</option>
              <option>Inactive</option>
              <option>Maintenance</option>
            </select>

            <input
              value={form.driver}
              onChange={(e) => setForm({ ...form, driver: e.target.value })}
              placeholder="Assigned Driver"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-500"
            />

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
            >
              {saving
                ? editingId
                  ? "Updating Vehicle..."
                  : "Saving Vehicle..."
                : editingId
                ? "Update Vehicle"
                : "Add Vehicle"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Fleet Records
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                Vehicle list
              </h2>
            </div>

            <div className="text-sm text-slate-500">
              {filteredVehicles.length} record{filteredVehicles.length === 1 ? "" : "s"}
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
              Loading vehicles...
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-lg font-semibold text-slate-700">No vehicles found</p>
              <p className="mt-2 text-sm text-slate-500">
                Add a new vehicle or change your search/filter.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredVehicles.map((vehicle) => (
                <div key={vehicle.id}>
                  <div className="sm:hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {vehicle.unitNumber || vehicle.plateNumber || "Vehicle"}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {vehicle.make || "-"} {vehicle.model || "-"} {vehicle.year || ""}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(
                          vehicle.status
                        )}`}
                      >
                        {vehicle.status || "Unknown"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] uppercase text-slate-400">Plate</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {vehicle.plateNumber || "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase text-slate-400">State</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {vehicle.state || "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase text-slate-400">Type</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {vehicle.type || "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase text-slate-400">Driver</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {vehicle.driver || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleEdit(vehicle)}
                        className="flex-1 rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(vehicle.id)}
                        className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-semibold text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="hidden sm:block rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-teal-200 hover:bg-white">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-bold text-slate-900">
                            {vehicle.unitNumber || vehicle.plateNumber || "Vehicle"}
                          </h3>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(
                              vehicle.status
                            )}`}
                          >
                            {vehicle.status || "Unknown"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-600">
                          {vehicle.make || "-"} {vehicle.model || "-"} {vehicle.year || ""}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Plate: {vehicle.plateNumber || "-"} • State: {vehicle.state || "-"} • Type: {vehicle.type || "-"}
                        </p>
                      </div>

                      <div className="text-left lg:text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          Driver: {vehicle.driver || "-"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Added {niceDate(vehicle.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl bg-white px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">VIN</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 break-all">
                        {vehicle.vin || "-"}
                      </p>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(vehicle)}
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(vehicle.id)}
                        className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
                      >
                        Delete
                      </button>

                      <div className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white">
                        Fleet Ready
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}