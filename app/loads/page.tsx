"use client";

import { useEffect, useMemo, useState } from "react";

type Load = {
  id: string;
  loadNumber?: string;
  broker?: string;
  pickupLocation?: string;
  deliveryLocation?: string;
  pickupDate?: string;
  deliveryDate?: string;
  status?: string;
  rate?: number | null;
  driver?: string;
  driverId?: string | null;
  truck?: string;
  totalMiles?: number | null;
  createdAt?: string;
};

type Driver = {
  id: string;
  name?: string;
};

function money(value?: number | null) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function dateValue(value?: string) {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
}

function niceDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

const statusOptions = ["Booked", "In Transit", "Delivered", "Cancelled"];

export default function LoadsPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [form, setForm] = useState({
    loadNumber: "",
    broker: "",
    pickupLocation: "",
    deliveryLocation: "",
    pickupDate: "",
    deliveryDate: "",
    status: "Booked",
    rate: "",
    driver: "",
    driverId: "",
    truck: "",
    totalMiles: "",
  });

  async function fetchData() {
    try {
      const [loadsRes, driversRes] = await Promise.all([
        fetch("/api/loads"),
        fetch("/api/drivers"),
      ]);

      const loadsData = await loadsRes.json();
      const driversData = await driversRes.json();

      setLoads(Array.isArray(loadsData) ? loadsData : []);
      setDrivers(Array.isArray(driversData) ? driversData : []);
    } catch (error) {
      console.error("Loads fetch error:", error);
      setLoads([]);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm({
      loadNumber: "",
      broker: "",
      pickupLocation: "",
      deliveryLocation: "",
      pickupDate: "",
      deliveryDate: "",
      status: "Booked",
      rate: "",
      driver: "",
      driverId: "",
      truck: "",
      totalMiles: "",
    });
  }

  function handleEdit(load: Load) {
    setEditingId(load.id);
    setForm({
      loadNumber: load.loadNumber || "",
      broker: load.broker || "",
      pickupLocation: load.pickupLocation || "",
      deliveryLocation: load.deliveryLocation || "",
      pickupDate: dateValue(load.pickupDate),
      deliveryDate: dateValue(load.deliveryDate),
      status: load.status || "Booked",
      rate: String(load.rate || ""),
      driver: load.driver || "",
      driverId: load.driverId || "",
      truck: load.truck || "",
      totalMiles: String(load.totalMiles || ""),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("Delete this load?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/loads/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Failed to delete load");
        return;
      }
      if (editingId === id) resetForm();
      await fetchData();
    } catch (error) {
      console.error("Delete load error:", error);
      alert("Failed to delete load");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        loadNumber: form.loadNumber,
        broker: form.broker,
        pickupLocation: form.pickupLocation,
        deliveryLocation: form.deliveryLocation,
        pickupDate: form.pickupDate,
        deliveryDate: form.deliveryDate,
        status: form.status,
        rate: form.rate ? Number(form.rate) : null,
        driver: form.driver,
        driverId: form.driverId || null,
        truck: form.truck,
        totalMiles: form.totalMiles ? Number(form.totalMiles) : null,
      };

      const url = editingId ? `/api/loads/${editingId}` : "/api/loads";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Load save error:", text);
        alert(editingId ? "Failed to update load" : "Failed to save load");
        return;
      }

      resetForm();
      await fetchData();
    } catch (error) {
      console.error("Load save error:", error);
      alert(editingId ? "Failed to update load" : "Failed to save load");
    } finally {
      setSaving(false);
    }
  }

  const filteredLoads = useMemo(() => {
    return loads.filter((load) => {
      const matchesSearch =
        String(load.loadNumber || "").toLowerCase().includes(search.toLowerCase()) ||
        String(load.broker || "").toLowerCase().includes(search.toLowerCase()) ||
        String(load.driver || "").toLowerCase().includes(search.toLowerCase()) ||
        String(load.truck || "").toLowerCase().includes(search.toLowerCase()) ||
        String(load.pickupLocation || "").toLowerCase().includes(search.toLowerCase()) ||
        String(load.deliveryLocation || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        String(load.status || "").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [loads, search, statusFilter]);

  const totalRevenue = useMemo(
    () => filteredLoads.reduce((sum, l) => sum + Number(l.rate || 0), 0),
    [filteredLoads]
  );

  const totalMiles = useMemo(
    () => filteredLoads.reduce((sum, l) => sum + Number(l.totalMiles || 0), 0),
    [filteredLoads]
  );

  const bookedCount = useMemo(
    () =>
      loads.filter((l) => String(l.status || "").toLowerCase() === "booked").length,
    [loads]
  );

  const transitCount = useMemo(
    () =>
      loads.filter((l) => String(l.status || "").toLowerCase() === "in transit").length,
    [loads]
  );

  const deliveredCount = useMemo(
    () =>
      loads.filter((l) => String(l.status || "").toLowerCase() === "delivered").length,
    [loads]
  );

  function statusBadge(status?: string) {
    const s = String(status || "").toLowerCase();
    if (s === "delivered") return "bg-emerald-100 text-emerald-700";
    if (s === "in transit") return "bg-blue-100 text-blue-700";
    if (s === "booked") return "bg-amber-100 text-amber-700";
    if (s === "cancelled") return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-700";
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-cyan-950 p-8 text-white shadow-xl xl:col-span-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
            Load Management
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Enterprise load board
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Create, assign, track, and manage every load with real dispatch-style workflow.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Booked</p>
              <p className="mt-2 text-2xl font-bold">{bookedCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">In Transit</p>
              <p className="mt-2 text-2xl font-bold">{transitCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Delivered</p>
              <p className="mt-2 text-2xl font-bold">{deliveredCount}</p>
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
              placeholder="Search load, broker, driver, truck..."
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:bg-white"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:bg-white"
            >
              <option>All</option>
              {statusOptions.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Filter Totals
          </p>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Loads</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{filteredLoads.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Revenue</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{money(totalRevenue)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Miles</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{totalMiles.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                {editingId ? "Edit Load" : "Add Load"}
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                {editingId ? "Update Load" : "New Load"}
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
              value={form.loadNumber}
              onChange={(e) => setForm({ ...form, loadNumber: e.target.value })}
              placeholder="Load Number"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500"
              required
            />

            <input
              value={form.broker}
              onChange={(e) => setForm({ ...form, broker: e.target.value })}
              placeholder="Broker"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500"
            />

            <input
              value={form.pickupLocation}
              onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })}
              placeholder="Pickup Location"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500"
            />

            <input
              value={form.deliveryLocation}
              onChange={(e) => setForm({ ...form, deliveryLocation: e.target.value })}
              placeholder="Delivery Location"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500"
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <input
                type="date"
                value={form.pickupDate}
                onChange={(e) => setForm({ ...form, pickupDate: e.target.value })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500"
              />
              <input
                type="date"
                value={form.deliveryDate}
                onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500"
              />
            </div>

            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500"
            >
              {statusOptions.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <input
                type="number"
                step="0.01"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                placeholder="Rate"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500"
              />
              <input
                type="number"
                step="0.01"
                value={form.totalMiles}
                onChange={(e) => setForm({ ...form, totalMiles: e.target.value })}
                placeholder="Miles"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500"
              />
            </div>

            <select
              value={form.driverId}
              onChange={(e) => {
                const selected = drivers.find((d) => d.id === e.target.value);
                setForm({
                  ...form,
                  driverId: e.target.value,
                  driver: selected?.name || "",
                });
              }}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500"
            >
              <option value="">Select Driver</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>

            <input
              value={form.truck}
              onChange={(e) => setForm({ ...form, truck: e.target.value })}
              placeholder="Truck"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500"
            />

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60"
            >
              {saving
                ? editingId
                  ? "Updating Load..."
                  : "Saving Load..."
                : editingId
                ? "Update Load"
                : "Add Load"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Dispatch Board
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                Load list
              </h2>
            </div>

            <div className="text-sm text-slate-500">
              {filteredLoads.length} record{filteredLoads.length === 1 ? "" : "s"}
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
              Loading loads...
            </div>
          ) : filteredLoads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-lg font-semibold text-slate-700">No loads found</p>
              <p className="mt-2 text-sm text-slate-500">
                Add a new load or change your search/filter.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredLoads.map((load) => (
                <div key={load.id}>
                  <div className="sm:hidden rounded-2xl border p-4 bg-white shadow-sm">
  <h3 className="font-bold text-sm">
    Load #{load.loadNumber || "-"}
  </h3>

  <p className="text-xs text-gray-500">
    {load.pickupLocation || "-"} → {load.deliveryLocation || "-"}
  </p>

  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
    <p><strong>Driver:</strong> {load.driver || "-"}</p>
    <p><strong>Truck:</strong> {load.truck || "-"}</p>
    <p><strong>Rate:</strong> ${load.rate || 0}</p>
    <p><strong>Miles:</strong> {load.totalMiles || 0}</p>
  </div>

  <div className="flex gap-2 mt-3">
    <button
      onClick={() => handleEdit(load)}
      className="flex-1 bg-slate-900 text-white rounded-lg py-2 text-xs"
    >
      Edit
    </button>

    <button
      onClick={() => handleDelete(load.id)}
      className="flex-1 bg-red-600 text-white rounded-lg py-2 text-xs"
    >
      Delete
    </button>
  </div>
</div>

                  <div className="hidden sm:block rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-cyan-200 hover:bg-white">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-bold text-slate-900">
                            Load #{load.loadNumber || "-"}
                          </h3>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(
                              load.status
                            )}`}
                          >
                            {load.status || "Unknown"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-600">
                          {load.pickupLocation || "-"} → {load.deliveryLocation || "-"}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Broker: {load.broker || "-"} • Driver: {load.driver || "-"} •
                          Truck: {load.truck || "-"}
                        </p>
                      </div>

                      <div className="text-left lg:text-right">
                        <p className="text-lg font-bold text-slate-900">
                          {money(load.rate)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {Number(load.totalMiles || 0).toLocaleString()} miles
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-4">
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Pickup
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {niceDate(load.pickupDate)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Delivery
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {niceDate(load.deliveryDate)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Driver
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {load.driver || "-"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Truck
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {load.truck || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(load)}
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(load.id)}
                        className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
                      >
                        Delete
                      </button>

                      <div className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white">
                        Dispatch Ready
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