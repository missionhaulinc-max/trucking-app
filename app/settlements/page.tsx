"use client";

import { useEffect, useMemo, useState } from "react";

type Driver = {
  id: string;
  name?: string;
  driverType?: string;
};

type Load = {
  id: string;
  loadNumber?: string;
  driver?: string;
  driverId?: string | null;
  pickupLocation?: string;
  deliveryLocation?: string;
  totalMiles?: number | null;
  rate?: number | null;
  status?: string;
};

type Expense = {
  id: string;
  category?: string;
  amount?: number | null;
  driver?: string;
  truck?: string;
  createdAt?: string;
};

type Settlement = {
  id: string;
  driverName?: string;
  driverId?: string | null;
  driverType?: string;
  paystubId?: string;
  payDate?: string;
  weekStart?: string;
  weekEnd?: string;
  grossAmount?: number | null;
  totalMiles?: number | null;
  totalExpense?: number | null;
  dispatchFee?: number | null;
  netAmount?: number | null;
};

function money(value?: number | null) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function ymd(value?: string) {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
}

function niceDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default function SettlementsPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [customExpense, setCustomExpense] = useState("0");

  async function fetchData() {
    try {
      const [driversRes, loadsRes, expensesRes, settlementsRes] = await Promise.all([
        fetch("/api/drivers", { cache: "no-store" }),
        fetch("/api/loads", { cache: "no-store" }),
        fetch("/api/expenses", { cache: "no-store" }),
        fetch("/api/settlements", { cache: "no-store" }),
      ]);

      const driversData = await driversRes.json();
      const loadsData = await loadsRes.json();
      const expensesData = await expensesRes.json();
      const settlementsData = await settlementsRes.json();

      setDrivers(Array.isArray(driversData) ? driversData : []);
      setLoads(Array.isArray(loadsData) ? loadsData : []);
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setSettlements(Array.isArray(settlementsData) ? settlementsData : []);
    } catch (error) {
      console.error("Settlement page fetch error:", error);
      setDrivers([]);
      setLoads([]);
      setExpenses([]);
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();

    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;

    const start = new Date(now);
    start.setDate(now.getDate() - diffToMonday);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    setWeekStart(start.toISOString().split("T")[0]);
    setWeekEnd(end.toISOString().split("T")[0]);
  }, []);

  const selectedDriver = useMemo(() => {
    return drivers.find((d) => d.id === selectedDriverId) || null;
  }, [drivers, selectedDriverId]);

  const selectedLoads = useMemo(() => {
    if (!selectedDriver) return [];

    return loads.filter((load) => {
      const matchesDriver =
        load.driverId === selectedDriver.id ||
        String(load.driver || "").trim().toLowerCase() ===
          String(selectedDriver.name || "").trim().toLowerCase();

      return matchesDriver;
    });
  }, [loads, selectedDriver]);

  const selectedExpenses = useMemo(() => {
    if (!selectedDriver) return [];

    return expenses.filter((expense) => {
      return (
        String(expense.driver || "").trim().toLowerCase() ===
        String(selectedDriver.name || "").trim().toLowerCase()
      );
    });
  }, [expenses, selectedDriver]);

  const grossAmount = useMemo(() => {
    return selectedLoads.reduce((sum, load) => sum + Number(load.rate || 0), 0);
  }, [selectedLoads]);

  const totalMiles = useMemo(() => {
    return selectedLoads.reduce((sum, load) => sum + Number(load.totalMiles || 0), 0);
  }, [selectedLoads]);

  const expenseFromRecords = useMemo(() => {
    return selectedExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }, [selectedExpenses]);

  const totalExpense = expenseFromRecords + Number(customExpense || 0);

  const dispatchFee = useMemo(() => {
    if (!selectedDriver) return 0;
    const type = String(selectedDriver.driverType || "").toLowerCase();
    if (type === "owner operator") {
      return grossAmount * 0.1;
    }
    return 0;
  }, [selectedDriver, grossAmount]);

  const netAmount = grossAmount - totalExpense - dispatchFee;

  async function handleCreateSettlement() {
    if (!selectedDriver) {
      alert("Please select a driver");
      return;
    }

    if (!weekStart || !weekEnd) {
      alert("Please select week start and week end");
      return;
    }

    setSaving(true);

    try {
      const paystubId = `PAY-${Date.now()}`;

      const payload = {
  driverName: selectedDriver.name || "",
  driverId: selectedDriver.id,
  driverType: selectedDriver.driverType || "Company Driver",
  paystubId: `PAY-${Date.now()}`,
  payDate: new Date().toISOString(),
  weekStart,
  weekEnd,
  grossAmount,
  totalMiles,
  totalExpense,
  dispatchFee,
  netAmount,
  loadDetails: JSON.stringify(
    selectedLoads.map((load) => ({
      id: load.id,
      loadNumber: load.loadNumber || "-",
      pickupLocation: load.pickupLocation || "-",
      deliveryLocation: load.deliveryLocation || "-",
      totalMiles: Number(load.totalMiles || 0),
      rate: Number(load.rate || 0),
      status: load.status || "-",
    }))
  ),
  expenseDetails: JSON.stringify(
    selectedExpenses.map((expense) => ({
      id: expense.id,
      category: expense.category || "Other",
      amount: Number(expense.amount || 0),
      driver: expense.driver || "-",
      truck: expense.truck || "-",
    }))
  ),
};

      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Create settlement error:", text);
        alert("Failed to create settlement");
        return;
      }

      await fetchData();
      alert("Settlement created");
    } catch (error) {
      console.error("Create settlement error:", error);
      alert("Failed to create settlement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Create Settlement
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Driver settlement
          </h1>

          <div className="mt-6 space-y-4">
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            >
              <option value="">Select Driver</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name} ({driver.driverType || "Driver"})
                </option>
              ))}
            </select>

            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />

            <input
              type="date"
              value={weekEnd}
              onChange={(e) => setWeekEnd(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />

            <input
              type="number"
              step="0.01"
              value={customExpense}
              onChange={(e) => setCustomExpense(e.target.value)}
              placeholder="Extra expense"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />

            <button
              onClick={handleCreateSettlement}
              disabled={saving}
              className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            >
              {saving ? "Creating..." : "Create Settlement"}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Auto Summary
          </p>

          {!selectedDriver ? (
            <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
              Select a driver to auto-calculate settlement.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Driver</p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {selectedDriver.name}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Gross</p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {money(grossAmount)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Miles</p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {totalMiles.toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Expenses</p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {money(totalExpense)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Dispatch Fee</p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {money(dispatchFee)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Net</p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {money(netAmount)}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Existing Settlements
        </p>

        {loading ? (
          <div className="mt-6 text-sm text-slate-500">Loading...</div>
        ) : (
          <div className="mt-6 grid gap-4">
            {settlements.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {item.driverName || "-"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {niceDate(item.weekStart)} - {niceDate(item.weekEnd)}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="font-bold text-slate-900">{money(item.netAmount)}</p>
                    <a
                      href={`/paystub/${item.id}`}
                      className="text-sm font-semibold text-blue-600"
                    >
                      Open Paystub
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}