"use client";

import { useEffect, useMemo, useState } from "react";

type Expense = {
  id: string;
  category: string;
  amount: number;
  date: string;
  driver?: string | null;
  truck?: string | null;
  notes?: string | null;
};

const categories = [
  "Fuel",
  "Toll",
  "Insurance",
  "Repair",
  "ELD",
  "IFTA",
  "Other",
];

function money(n: number) {
  return `$${Number(n || 0).toLocaleString()}`;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const [form, setForm] = useState({
    category: "Fuel",
    amount: "",
    date: "",
    driver: "",
    truck: "",
    notes: "",
  });

  async function fetchExpenses() {
    const res = await fetch("/api/expenses");
    const data = await res.json();
    setExpenses(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    fetchExpenses();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm({
      category: "Fuel",
      amount: "",
      date: "",
      driver: "",
      truck: "",
      notes: "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.amount || !form.date) {
      alert("Amount + Date required");
      return;
    }

    const payload = {
      category: form.category,
      amount: Number(form.amount),
      date: form.date,
      driver: form.driver || null,
      truck: form.truck || null,
      notes: form.notes || null,
    };

    const url = editingId ? `/api/expenses/${editingId}` : "/api/expenses";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert("Error saving expense");
      return;
    }

    resetForm();
    fetchExpenses();
  }

  function handleEdit(e: Expense) {
    setEditingId(e.id);
    setForm({
      category: e.category,
      amount: String(e.amount),
      date: e.date.split("T")[0],
      driver: e.driver || "",
      truck: e.truck || "",
      notes: e.notes || "",
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete expense?")) return;

    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    fetchExpenses();
  }

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        e.category.toLowerCase().includes(search.toLowerCase()) ||
        (e.driver || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.truck || "").toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        filterCategory === "All" || e.category === filterCategory;

      return matchSearch && matchCategory;
    });
  }, [expenses, search, filterCategory]);

  const total = useMemo(() => {
    return filtered.reduce((sum, e) => sum + e.amount, 0);
  }, [filtered]);

  const weeklyChart = useMemo(() => {
    const today = new Date();
    const days: { label: string; value: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);

      const label = d.toLocaleDateString(undefined, { weekday: "short" });

      const value = filtered
        .filter((expense) => {
          const expenseDate = new Date(expense.date);
          return expenseDate.toDateString() === d.toDateString();
        })
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

      days.push({ label, value });
    }

    return days;
  }, [filtered]);

  const categoryChart = useMemo(() => {
    const map = new Map<string, number>();

    filtered.forEach((expense) => {
      map.set(
        expense.category,
        (map.get(expense.category) || 0) + Number(expense.amount || 0)
      );
    });

    return Array.from(map.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  const driverChart = useMemo(() => {
    const map = new Map<string, number>();

    filtered.forEach((expense) => {
      const driver = expense.driver || "Unassigned";
      map.set(driver, (map.get(driver) || 0) + Number(expense.amount || 0));
    });

    return Array.from(map.entries())
      .map(([driver, total]) => ({ driver, total }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  const maxWeekly = Math.max(...weeklyChart.map((d) => d.value), 1);
  const maxCategory = Math.max(...categoryChart.map((c) => c.total), 1);
  const maxDriver = Math.max(...driverChart.map((d) => d.total), 1);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-xl xl:col-span-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">
            Expense Center
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Expense analytics and records
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Track, filter, edit, and analyze company expenses with charts and reports.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Records
              </p>
              <p className="mt-2 text-2xl font-bold">{filtered.length}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Total
              </p>
              <p className="mt-2 text-2xl font-bold">{money(total)}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Categories
              </p>
              <p className="mt-2 text-2xl font-bold">{categoryChart.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Search
          </p>
          <div className="mt-5 space-y-4">
            <input
              placeholder="Search by category, driver, truck..."
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:bg-white"
            >
              <option>All</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Summary
          </p>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Top Category</p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {categoryChart[0]?.category || "-"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Top Driver</p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {driverChart[0]?.driver || "-"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                {editingId ? "Edit Expense" : "Add Expense"}
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                {editingId ? "Update Expense" : "New Expense"}
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
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
            />

            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
            />

            <input
              placeholder="Driver"
              value={form.driver}
              onChange={(e) => setForm({ ...form, driver: e.target.value })}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
            />

            <input
              placeholder="Truck"
              value={form.truck}
              onChange={(e) => setForm({ ...form, truck: e.target.value })}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
            />

            <textarea
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              rows={4}
            />

            <button className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700">
              {editingId ? "Update Expense" : "Add Expense"}
            </button>
          </form>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Weekly Chart
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">
                  Expenses by day
                </h2>
              </div>

              <div className="grid grid-cols-7 items-end gap-3 h-72">
                {weeklyChart.map((item) => (
                  <div
                    key={item.label}
                    className="flex h-full flex-col items-center justify-end gap-3"
                  >
                    <div className="text-xs font-semibold text-slate-500">
                      {item.value ? money(item.value) : "$0"}
                    </div>
                    <div className="flex h-52 w-full items-end rounded-2xl bg-slate-100 p-2">
                      <div
                        className="w-full rounded-xl bg-emerald-500"
                        style={{
                          height: `${Math.max(
                            (item.value / maxWeekly) * 100,
                            item.value ? 10 : 4
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs font-semibold text-slate-600">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Categories
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">
                  Expense category chart
                </h2>
              </div>

              <div className="space-y-4">
                {categoryChart.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                    No category data
                  </div>
                ) : (
                  categoryChart.map((item) => (
                    <div key={item.category} className="rounded-2xl border border-slate-200 p-4">
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <p className="font-semibold text-slate-900">{item.category}</p>
                        <p className="font-bold text-slate-900">{money(item.total)}</p>
                      </div>
                      <div className="h-3 w-full rounded-full bg-slate-100">
                        <div
                          className="h-3 rounded-full bg-amber-500"
                          style={{
                            width: `${Math.max((item.total / maxCategory) * 100, 6)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Driver Breakdown
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                Expense by driver
              </h2>
            </div>

            <div className="space-y-4">
              {driverChart.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                  No driver data
                </div>
              ) : (
                driverChart.map((item) => (
                  <div key={item.driver} className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <p className="font-semibold text-slate-900">{item.driver}</p>
                      <p className="font-bold text-slate-900">{money(item.total)}</p>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100">
                      <div
                        className="h-3 rounded-full bg-blue-600"
                        style={{
                          width: `${Math.max((item.total / maxDriver) * 100, 6)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Expense Records
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                Filtered expense list
              </h2>
            </div>

            {loading ? (
              <p>Loading...</p>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <p className="text-lg font-semibold text-slate-700">No expenses found</p>
                <p className="mt-2 text-sm text-slate-500">
                  Add a new expense or change your filters.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filtered.map((e) => (
                  <div key={e.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-lg font-bold text-slate-900">{e.category}</p>
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {money(e.amount)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          {new Date(e.date).toLocaleDateString()} • {e.driver || "-"} • {e.truck || "-"}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">{e.notes || "No notes"}</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(e)}
                          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(e.id)}
                          className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}