"use client";

import { useEffect, useMemo, useState } from "react";
import AuthGuard from "../../components/AuthGuard";

type Load = {
  id: string;
  loadNumber?: string;
  pickupLocation?: string;
  deliveryLocation?: string;
  pickupDate?: string;
  deliveryDate?: string;
  rate?: number | null;
  driver?: string;
  driverId?: string | null;
  truck?: string;
  status?: string;
  totalMiles?: number | null;
};

type Expense = {
  id: string;
  category?: string;
  amount?: number | null;
  date?: string;
  driver?: string;
  driverId?: string | null;
  truck?: string;
  notes?: string;
  createdAt?: string;
};

function money(value?: number | null) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function niceDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default function DriverDashboardPage() {
  const [username, setUsername] = useState("");
  const [loads, setLoads] = useState<Load[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const savedUsername = localStorage.getItem("username") || "";
        const savedDriverName = localStorage.getItem("driverName") || savedUsername;
        const savedDriverId = localStorage.getItem("driverId") || "";

        setUsername(savedDriverName);

        const [loadsRes, expensesRes] = await Promise.all([
          fetch("/api/loads", { cache: "no-store" }),
          fetch("/api/expenses", { cache: "no-store" }),
        ]);

        const loadsData = await loadsRes.json();
        const expensesData = await expensesRes.json();

        const allLoads: Load[] = Array.isArray(loadsData) ? loadsData : [];
        const allExpenses: Expense[] = Array.isArray(expensesData) ? expensesData : [];

        const driverLoads = allLoads.filter((load) => {
          if (savedDriverId && load.driverId === savedDriverId) return true;

          return (
            String(load.driver || "").trim().toLowerCase() ===
            String(savedDriverName || "").trim().toLowerCase()
          );
        });

        const driverExpenses = allExpenses.filter((expense) => {
          if (savedDriverId && expense.driverId === savedDriverId) return true;

          return (
            String(expense.driver || "").trim().toLowerCase() ===
            String(savedDriverName || "").trim().toLowerCase()
          );
        });

        setLoads(driverLoads);
        setExpenses(driverExpenses);
      } catch (error) {
        console.error("Driver dashboard fetch error:", error);
        setLoads([]);
        setExpenses([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const totalLoads = useMemo(() => loads.length, [loads]);

  const totalMiles = useMemo(() => {
    return loads.reduce((sum, load) => sum + Number(load.totalMiles || 0), 0);
  }, [loads]);

  const totalRevenue = useMemo(() => {
    return loads.reduce((sum, load) => sum + Number(load.rate || 0), 0);
  }, [loads]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }, [expenses]);

  const netEstimate = totalRevenue - totalExpenses;

  const recentLoads = useMemo(() => {
    return [...loads]
      .sort((a, b) => {
        const aDate = a.pickupDate ? new Date(a.pickupDate).getTime() : 0;
        const bDate = b.pickupDate ? new Date(b.pickupDate).getTime() : 0;
        return bDate - aDate;
      })
      .slice(0, 5);
  }, [loads]);

  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => {
        const aDate = new Date(a.date || a.createdAt || "").getTime();
        const bDate = new Date(b.date || b.createdAt || "").getTime();
        return bDate - aDate;
      })
      .slice(0, 5);
  }, [expenses]);

  if (loading) {
    return (
      <AuthGuard allowedRole="driver">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Loading driver dashboard...</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRole="driver">
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
            Driver Dashboard
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Welcome, {username || "Driver"}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Here you can see your assigned loads, total miles, expenses, and estimated pay.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Total Loads
              </p>
              <p className="mt-2 text-2xl font-bold">{totalLoads}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Total Miles
              </p>
              <p className="mt-2 text-2xl font-bold">
                {totalMiles.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Revenue
              </p>
              <p className="mt-2 text-2xl font-bold">{money(totalRevenue)}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Expenses
              </p>
              <p className="mt-2 text-2xl font-bold">{money(totalExpenses)}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Net Estimate
              </p>
              <p className="mt-2 text-2xl font-bold">{money(netEstimate)}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Assigned Loads
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                Recent Loads
              </h2>
            </div>

            {recentLoads.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                No assigned loads found.
              </div>
            ) : (
              <div className="space-y-4">
                {recentLoads.map((load) => (
                  <div
                    key={load.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="font-semibold text-slate-900">
                      #{load.loadNumber || "-"} • {load.pickupLocation || "-"} →{" "}
                      {load.deliveryLocation || "-"}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {niceDate(load.pickupDate)} • {money(load.rate)} •{" "}
                      {Number(load.totalMiles || 0).toLocaleString()} miles
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Truck: {load.truck || "-"} • Status: {load.status || "-"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Expenses
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                Recent Expenses
              </h2>
            </div>

            {recentExpenses.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                No expense history found.
              </div>
            ) : (
              <div className="space-y-4">
                {recentExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {expense.category || "No category"}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {niceDate(expense.date || expense.createdAt)}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Truck: {expense.truck || "-"}
                        </p>
                      </div>

                      <p className="text-sm font-bold text-slate-900">
                        {money(expense.amount)}
                      </p>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      {expense.notes || "No notes"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </AuthGuard>
  );
}