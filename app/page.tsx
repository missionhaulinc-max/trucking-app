"use client";

import AuthGuard from "../components/AuthGuard";
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

type Settlement = {
  id: string;
  driverName?: string;
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
  createdAt?: string;
};

function money(value?: number | null) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function niceDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default function DashboardPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function fetchDashboardData() {
    try {
      const [loadsRes, expensesRes, settlementsRes] = await Promise.all([
        fetch("/api/loads", { cache: "no-store" }),
        fetch("/api/expenses", { cache: "no-store" }),
        fetch("/api/settlements", { cache: "no-store" }),
      ]);

      const loadsData = await loadsRes.json();
      const expensesData = await expensesRes.json();
      const settlementsData = await settlementsRes.json();

      setLoads(Array.isArray(loadsData) ? loadsData : []);
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setSettlements(Array.isArray(settlementsData) ? settlementsData : []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      setLoads([]);
      setExpenses([]);
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalRevenue = useMemo(
    () => loads.reduce((sum, load) => sum + Number(load.rate || 0), 0),
    [loads]
  );

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [expenses]
  );

  const totalProfit = totalRevenue - totalExpenses;

  const totalMiles = useMemo(
    () => loads.reduce((sum, load) => sum + Number(load.totalMiles || 0), 0),
    [loads]
  );

  const deliveredLoads = useMemo(
    () => loads.filter((load) => String(load.status || "").toLowerCase() === "delivered").length,
    [loads]
  );

  const inTransitLoads = useMemo(
    () => loads.filter((load) => String(load.status || "").toLowerCase() === "in transit").length,
    [loads]
  );

  const bookedLoads = useMemo(
    () => loads.filter((load) => String(load.status || "").toLowerCase() === "booked").length,
    [loads]
  );

  const weeklyRevenue = useMemo(() => {
    const today = new Date();
    const days: { label: string; revenue: number; expense: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);

      const label = d.toLocaleDateString(undefined, { weekday: "short" });

      const revenue = loads
        .filter((load) => {
          const loadDate = new Date(load.pickupDate || load.createdAt || "");
          return loadDate.toDateString() === d.toDateString();
        })
        .reduce((sum, load) => sum + Number(load.rate || 0), 0);

      const expense = expenses
        .filter((expense) => {
          const expenseDate = new Date(expense.date || expense.createdAt || "");
          return expenseDate.toDateString() === d.toDateString();
        })
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

      days.push({ label, revenue, expense });
    }

    return days;
  }, [loads, expenses]);

  const topDrivers = useMemo(() => {
    const map = new Map<string, { revenue: number; loads: number; miles: number }>();

    loads.forEach((load) => {
      const name = String(load.driver || "Unassigned").trim() || "Unassigned";
      if (!map.has(name)) {
        map.set(name, { revenue: 0, loads: 0, miles: 0 });
      }
      const current = map.get(name)!;
      current.revenue += Number(load.rate || 0);
      current.loads += 1;
      current.miles += Number(load.totalMiles || 0);
    });

    return Array.from(map.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [loads]);

  const recentLoads = useMemo(() => {
    return [...loads]
      .sort((a, b) => {
        const aDate = new Date(a.createdAt || a.pickupDate || "").getTime();
        const bDate = new Date(b.createdAt || b.pickupDate || "").getTime();
        return bDate - aDate;
      })
      .slice(0, 5);
  }, [loads]);

  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => {
        const aDate = new Date(a.createdAt || a.date || "").getTime();
        const bDate = new Date(b.createdAt || b.date || "").getTime();
        return bDate - aDate;
      })
      .slice(0, 5);
  }, [expenses]);

  const recentSettlements = useMemo(() => {
    return [...settlements]
      .sort((a, b) => {
        const aDate = new Date(a.payDate || a.createdAt || "").getTime();
        const bDate = new Date(b.payDate || b.createdAt || "").getTime();
        return bDate - aDate;
      })
      .slice(0, 5);
  }, [settlements]);

  const maxWeekly = Math.max(...weeklyRevenue.flatMap((d) => [d.revenue, d.expense]), 1);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Loading dashboard...</p>
      </div>
    );
  }

 return (
  <AuthGuard allowedRole="admin">
    <div className="space-y-6 sm:space-y-8">
      <section className="grid gap-4 sm:gap-6 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 p-5 text-white shadow-xl sm:p-8 xl:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200 sm:text-sm">
            Mission Control
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-4xl">
            Enterprise Operations Dashboard
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
            Real-time overview of dispatch, revenue, costs, payroll, and fleet performance.
          </p>

          <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-xs">Revenue</p>
              <p className="mt-2 text-xl font-bold sm:text-2xl">{money(totalRevenue)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-xs">Expenses</p>
              <p className="mt-2 text-xl font-bold sm:text-2xl">{money(totalExpenses)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-xs">Profit</p>
              <p className="mt-2 text-xl font-bold sm:text-2xl">{money(totalProfit)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-xs">Last Updated</p>
              <p className="mt-2 text-base font-bold sm:text-lg">
                {lastUpdated ? lastUpdated.toLocaleTimeString() : "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-sm">
            Load Status
          </p>
          <div className="mt-4 grid gap-3 sm:mt-5">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-xs">Booked</p>
              <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{bookedLoads}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-xs">In Transit</p>
              <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{inTransitLoads}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-xs">Delivered</p>
              <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{deliveredLoads}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-sm">
            Operations
          </p>
          <div className="mt-4 grid gap-3 sm:mt-5">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-xs">Total Loads</p>
              <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{loads.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-xs">Total Miles</p>
              <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{totalMiles.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-xs">Settlements</p>
              <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{settlements.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 sm:mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-sm">
              Weekly Performance
            </p>
            <h2 className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">
              Revenue vs expense
            </h2>
          </div>

          <div className="grid grid-cols-7 items-end gap-2 sm:gap-3 h-64 sm:h-72">
            {weeklyRevenue.map((item) => (
              <div key={item.label} className="flex h-full flex-col items-center justify-end gap-2 sm:gap-3">
                <div className="text-[10px] font-semibold text-slate-500 sm:text-xs">
                  {item.revenue ? money(item.revenue) : "$0"}
                </div>
                <div className="flex h-44 sm:h-52 w-full items-end gap-1 rounded-2xl bg-slate-100 p-2">
                  <div
                    className="w-1/2 rounded-xl bg-blue-600"
                    style={{
                      height: `${Math.max((item.revenue / maxWeekly) * 100, item.revenue ? 10 : 4)}%`,
                    }}
                  />
                  <div
                    className="w-1/2 rounded-xl bg-red-500"
                    style={{
                      height: `${Math.max((item.expense / maxWeekly) * 100, item.expense ? 10 : 4)}%`,
                    }}
                  />
                </div>
                <div className="text-[10px] font-semibold text-slate-600 sm:text-xs">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 sm:mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-sm">
              Driver Rankings
            </p>
            <h2 className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">
              Top drivers by revenue
            </h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {topDrivers.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                No driver data yet.
              </div>
            ) : (
              topDrivers.map((item, index) => (
                <div
                  key={item.name}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="sm:hidden space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          #{index + 1} {item.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Loads: {item.loads}
                        </p>
                      </div>
                      <p className="font-bold text-slate-900 text-sm">{money(item.revenue)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] uppercase text-slate-400">Miles</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {item.miles.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] uppercase text-slate-400">Revenue</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {money(item.revenue)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">
                        #{index + 1} {item.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Loads: {item.loads} • Miles: {item.miles.toLocaleString()}
                      </p>
                    </div>
                    <p className="font-bold text-slate-900">{money(item.revenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 sm:mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-sm">
              Recent Loads
            </p>
            <h2 className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">
              Dispatch activity
            </h2>
          </div>

          <div className="space-y-3">
            {recentLoads.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                No loads yet.
              </div>
            ) : (
              recentLoads.map((load) => (
                <div key={load.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                  <div className="sm:hidden space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {load.pickupLocation || "-"} → {load.deliveryLocation || "-"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          #{load.loadNumber || "-"}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-slate-700">{money(load.rate)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] uppercase text-slate-400">Driver</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {load.driver || "Unassigned"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] uppercase text-slate-400">Status</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {load.status || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {load.pickupLocation || "-"} → {load.deliveryLocation || "-"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        #{load.loadNumber || "-"} • {load.driver || "Unassigned"}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-700">{money(load.rate)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 sm:mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-sm">
              Recent Expenses
            </p>
            <h2 className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">
              Cost activity
            </h2>
          </div>

          <div className="space-y-3">
            {recentExpenses.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                No expenses yet.
              </div>
            ) : (
              recentExpenses.map((expense) => (
                <div key={expense.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                  <div className="sm:hidden space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {expense.category || "No category"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {niceDate(expense.date || expense.createdAt)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-slate-700">
                        {money(expense.amount)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] uppercase text-slate-400">Driver</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {expense.driver || "Unassigned"}
                      </p>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {expense.category || "No category"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {expense.driver || "Unassigned"} • {niceDate(expense.date || expense.createdAt)}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-700">{money(expense.amount)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 sm:mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-sm">
              Recent Settlements
            </p>
            <h2 className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">
              Payroll activity
            </h2>
          </div>

          <div className="space-y-3">
            {recentSettlements.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                No settlements yet.
              </div>
            ) : (
              recentSettlements.map((settlement) => (
                <div key={settlement.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                  <div className="sm:hidden space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {settlement.driverName || "-"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {niceDate(settlement.weekStart)} - {niceDate(settlement.weekEnd)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-slate-700">
                        {money(settlement.netAmount)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] uppercase text-slate-400">Type</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {settlement.driverType || "-"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] uppercase text-slate-400">Net</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {money(settlement.netAmount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {settlement.driverName || "-"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {niceDate(settlement.weekStart)} - {niceDate(settlement.weekEnd)}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-700">
                      {money(settlement.netAmount)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
   </div>
  </AuthGuard>
);
}