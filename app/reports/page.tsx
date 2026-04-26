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

export default function ReportsPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function fetchData() {
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
      console.error("Reports fetch error:", error);
      setLoads([]);
      setExpenses([]);
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalRevenue = useMemo(
    () => loads.reduce((sum, l) => sum + Number(l.rate || 0), 0),
    [loads]
  );

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
    [expenses]
  );

  const totalProfit = totalRevenue - totalExpenses;

  const totalMiles = useMemo(
    () => loads.reduce((sum, l) => sum + Number(l.totalMiles || 0), 0),
    [loads]
  );

  const deliveredLoads = useMemo(
    () => loads.filter((l) => String(l.status || "").toLowerCase() === "delivered").length,
    [loads]
  );

  const activeLoads = useMemo(
    () => loads.filter((l) => String(l.status || "").toLowerCase() !== "delivered").length,
    [loads]
  );

  const expenseCategoryData = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      const category = String(e.category || "Other").trim() || "Other";
      map.set(category, (map.get(category) || 0) + Number(e.amount || 0));
    });

    return Array.from(map.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const profitPerTruck = useMemo(() => {
    const revenueMap = new Map<string, number>();
    const expenseMap = new Map<string, number>();

    loads.forEach((l) => {
      const truck = String(l.truck || "Unassigned").trim() || "Unassigned";
      revenueMap.set(truck, (revenueMap.get(truck) || 0) + Number(l.rate || 0));
    });

    expenses.forEach((e) => {
      const truck = String(e.truck || "Unassigned").trim() || "Unassigned";
      expenseMap.set(truck, (expenseMap.get(truck) || 0) + Number(e.amount || 0));
    });

    const allTrucks = new Set([
      ...Array.from(revenueMap.keys()),
      ...Array.from(expenseMap.keys()),
    ]);

    return Array.from(allTrucks)
      .map((truck) => {
        const revenue = revenueMap.get(truck) || 0;
        const expense = expenseMap.get(truck) || 0;
        return {
          truck,
          revenue,
          expense,
          profit: revenue - expense,
        };
      })
      .sort((a, b) => b.profit - a.profit);
  }, [loads, expenses]);

  const topDrivers = useMemo(() => {
    const map = new Map<string, { revenue: number; loads: number; miles: number }>();

    loads.forEach((l) => {
      const name = String(l.driver || "Unknown").trim() || "Unknown";
      if (!map.has(name)) {
        map.set(name, { revenue: 0, loads: 0, miles: 0 });
      }

      const current = map.get(name)!;
      current.revenue += Number(l.rate || 0);
      current.loads += 1;
      current.miles += Number(l.totalMiles || 0);
    });

    return Array.from(map.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [loads]);

  const weeklyPayroll = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diffToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekSettlements = settlements.filter((s) => {
      const payDate = new Date(s.payDate || s.createdAt || "");
      return payDate >= weekStart && payDate <= weekEnd;
    });

    const totalGross = weekSettlements.reduce(
      (sum, s) => sum + Number(s.grossAmount || 0),
      0
    );

    const totalNet = weekSettlements.reduce(
      (sum, s) => sum + Number(s.netAmount || 0),
      0
    );

    return {
      weekStart,
      weekEnd,
      count: weekSettlements.length,
      items: weekSettlements,
      totalGross,
      totalNet,
    };
  }, [settlements]);

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

  const handlePrintPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 print:space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 p-5 text-white shadow-xl sm:p-8 print:shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200 sm:text-sm">
              Enterprise Reports
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-4xl">
              Admin Reports Dashboard
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
              Revenue, expenses, truck profitability, payroll, and live performance in one mobile-ready dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row print:hidden">
            <button
              onClick={fetchData}
              className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20"
            >
              Refresh Now
            </button>
            <button
              onClick={handlePrintPDF}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Export PDF
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 xl:grid-cols-5">
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
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-xs">Delivered</p>
            <p className="mt-2 text-xl font-bold sm:text-2xl">{deliveredLoads}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-xs">Last Updated</p>
            <p className="mt-2 text-base font-bold sm:text-lg">
              {lastUpdated ? lastUpdated.toLocaleTimeString() : "-"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:gap-6 xl:grid-cols-3">
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
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-xs">Active Loads</p>
              <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{activeLoads}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-xs">Total Miles</p>
              <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{totalMiles.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
          <div className="mb-5 sm:mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-sm">
              Expense Categories
            </p>
            <h2 className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">
              Category breakdown
            </h2>
          </div>

          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {expenseCategoryData.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                No expense categories yet.
              </div>
            ) : (
              expenseCategoryData.map((item) => (
                <div key={item.category} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-slate-900 text-sm sm:text-base">{item.category}</p>
                    <p className="font-bold text-slate-900 text-sm sm:text-base">{money(item.total)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 sm:mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-sm">
              Payroll
            </p>
            <h2 className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">
              Weekly payroll report
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {niceDate(weeklyPayroll.weekStart.toISOString())} - {niceDate(weeklyPayroll.weekEnd.toISOString())}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-xs">Settlements</p>
              <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{weeklyPayroll.count}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-xs">Gross</p>
              <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{money(weeklyPayroll.totalGross)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-xs">Net</p>
              <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{money(weeklyPayroll.totalNet)}</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {weeklyPayroll.items.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                No payroll settlements this week.
              </div>
            ) : (
              weeklyPayroll.items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                  <div className="sm:hidden space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{item.driverName || "-"}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.driverType || "-"} • #{item.paystubId || item.id}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{money(item.netAmount)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] uppercase text-slate-400">Gross</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {money(item.grossAmount)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] uppercase text-slate-400">Net</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {money(item.netAmount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{item.driverName || "-"}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.driverType || "-"} • Paystub #{item.paystubId || item.id}
                      </p>
                    </div>
                    <p className="font-bold text-slate-900">{money(item.netAmount)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 sm:mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-sm">
              Truck Profitability
            </p>
            <h2 className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">
              Profit per truck
            </h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {profitPerTruck.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                No truck data yet.
              </div>
            ) : (
              profitPerTruck.map((item) => (
                <div key={item.truck} className="rounded-2xl border border-slate-200 p-4">
                  <div className="sm:hidden space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{item.truck}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Revenue: {money(item.revenue)}
                        </p>
                      </div>
                      <p className="font-bold text-slate-900 text-sm">{money(item.profit)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] uppercase text-slate-400">Expense</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {money(item.expense)}
                      </p>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{item.truck}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Revenue: {money(item.revenue)} • Expense: {money(item.expense)}
                      </p>
                    </div>
                    <p className="font-bold text-slate-900">{money(item.profit)}</p>
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
              Activity
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
                        <p className="mt-1 text-xs text-slate-500">#{load.loadNumber || "-"}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-700">{money(load.rate)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] uppercase text-slate-400">Driver</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {load.driver || "Unassigned"}
                      </p>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {load.pickupLocation || "-"} → {load.deliveryLocation || "-"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Load #{load.loadNumber || "-"} • {load.driver || "Unassigned"}
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
              Activity
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
                      <p className="text-sm font-bold text-slate-700">{money(expense.amount)}</p>
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
              Top Drivers
            </p>
            <h2 className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">
              Performance
            </h2>
          </div>

          <div className="space-y-3">
            {topDrivers.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                No driver data yet.
              </div>
            ) : (
              topDrivers.slice(0, 5).map((item, index) => (
                <div key={item.name} className="rounded-2xl border border-slate-200 px-4 py-4">
                  <div className="sm:hidden space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          #{index + 1} {item.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Loads: {item.loads}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-700">{money(item.revenue)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] uppercase text-slate-400">Miles</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {item.miles.toLocaleString()}
                      </p>
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
                    <p className="text-sm font-bold text-slate-700">{money(item.revenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}