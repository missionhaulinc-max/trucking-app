"use client";

import { useEffect, useMemo, useState } from "react";

type Load = {
  id: string;
  loadNumber?: string;
  pickupLocation?: string;
  deliveryLocation?: string;
  pickupDate?: string;
  deliveryDate?: string;
  rate?: number | null;
  driver?: string;
  truck?: string;
  status?: string;
  totalMiles?: number | null;
};

type Expense = {
  id: string;
  category?: string;
  amount?: number | null;
  driver?: string;
  truck?: string;
  notes?: string;
  createdAt?: string;
};

export default function DriverPaystubPage() {
  const [username, setUsername] = useState("");
  const [loads, setLoads] = useState<Load[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const savedUsername = localStorage.getItem("username") || "";
        setUsername(savedUsername);

        const [loadsRes, expensesRes] = await Promise.all([
          fetch("/api/loads"),
          fetch("/api/expenses"),
        ]);

        const loadsData = await loadsRes.json();
        const expensesData = await expensesRes.json();

        const allLoads = Array.isArray(loadsData) ? loadsData : [];
        const allExpenses = Array.isArray(expensesData) ? expensesData : [];

        const driverLoads = allLoads.filter(
          (load: Load) =>
            String(load.driver || "").toLowerCase() === savedUsername.toLowerCase()
        );

        const driverExpenses = allExpenses.filter(
          (expense: Expense) =>
            String(expense.driver || "").toLowerCase() === savedUsername.toLowerCase()
        );

        setLoads(driverLoads);
        setExpenses(driverExpenses);
      } catch (error) {
        console.error("Driver paystub fetch error:", error);
        setLoads([]);
        setExpenses([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const totalMiles = useMemo(
    () => loads.reduce((sum, load) => sum + Number(load.totalMiles || 0), 0),
    [loads]
  );

  const grossPay = useMemo(
    () => loads.reduce((sum, load) => sum + Number(load.rate || 0), 0),
    [loads]
  );

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [expenses]
  );

  const netPay = grossPay - totalExpenses;

  const expenseBreakdown = useMemo(() => {
    const map = new Map<string, number>();

    for (const item of expenses) {
      const key = item.category || "Other";
      map.set(key, (map.get(key) || 0) + Number(item.amount || 0));
    }

    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const generatePDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const loadDetailsHtml =
      loads.length > 0
        ? loads
            .map(
              (load) => `
                <div class="row">
                  <span>${load.loadNumber || "-"} | ${load.pickupLocation || "-"} → ${load.deliveryLocation || "-"}</span>
                  <span class="value">$${Number(load.rate || 0).toFixed(2)}</span>
                </div>
              `
            )
            .join("")
        : `<div class="row"><span>No loads found</span><span class="value">-</span></div>`;

    const expenseDetailsHtml =
      expenseBreakdown.length > 0
        ? expenseBreakdown
            .map(
              (item) => `
                <div class="row">
                  <span>${item.name}</span>
                  <span class="value">$${Number(item.amount || 0).toFixed(2)}</span>
                </div>
              `
            )
            .join("")
        : `<div class="row"><span>No expenses found</span><span class="value">$0.00</span></div>`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Driver Paystub</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              padding: 36px;
              color: #111827;
              background: #ffffff;
            }
            .page {
              max-width: 900px;
              margin: 0 auto;
            }
            .hero {
              background: linear-gradient(135deg, #0f172a, #1e293b, #1d4ed8);
              color: white;
              padding: 24px;
              border-radius: 20px;
              margin-bottom: 20px;
            }
            .hero-title {
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 8px;
            }
            .hero-sub {
              color: #cbd5e1;
              font-size: 14px;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
              margin-bottom: 20px;
            }
            .card {
              border: 1px solid #e5e7eb;
              border-radius: 18px;
              padding: 18px;
              background: #ffffff;
            }
            .card-title {
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.18em;
              color: #64748b;
              margin-bottom: 12px;
              font-weight: 700;
            }
            .row {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              padding: 10px 0;
              border-bottom: 1px solid #f1f5f9;
              font-size: 14px;
            }
            .row:last-child {
              border-bottom: none;
            }
            .value {
              font-weight: 600;
            }
            .stats {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
              margin-bottom: 20px;
            }
            .stat {
              border-radius: 18px;
              padding: 18px;
              background: #f8fafc;
              border: 1px solid #e5e7eb;
            }
            .stat-label {
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.18em;
              color: #64748b;
              margin-bottom: 10px;
              font-weight: 700;
            }
            .stat-value {
              font-size: 28px;
              font-weight: 800;
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="hero">
              <div class="hero-title">Mission Haul Inc</div>
              <div class="hero-sub">Driver Paystub</div>
            </div>

            <div class="grid">
              <div class="card">
                <div class="card-title">Driver Information</div>
                <div class="row"><span>Driver</span><span class="value">${username || "-"}</span></div>
                <div class="row"><span>Pay Date</span><span class="value">${new Date().toLocaleDateString()}</span></div>
                <div class="row"><span>Total Loads</span><span class="value">${loads.length}</span></div>
                <div class="row"><span>Total Miles</span><span class="value">${totalMiles.toLocaleString()}</span></div>
              </div>

              <div class="card">
                <div class="card-title">Pay Summary</div>
                <div class="row"><span>Gross Pay</span><span class="value">$${grossPay.toFixed(2)}</span></div>
                <div class="row"><span>Total Expenses</span><span class="value">$${totalExpenses.toFixed(2)}</span></div>
                <div class="row"><span>Net Pay</span><span class="value">$${netPay.toFixed(2)}</span></div>
              </div>
            </div>

            <div class="stats">
              <div class="stat">
                <div class="stat-label">Gross Pay</div>
                <div class="stat-value">$${grossPay.toFixed(2)}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Expenses</div>
                <div class="stat-value">$${totalExpenses.toFixed(2)}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Net Pay</div>
                <div class="stat-value">$${netPay.toFixed(2)}</div>
              </div>
            </div>

            <div class="card" style="margin-bottom: 20px;">
              <div class="card-title">Load Details</div>
              ${loadDetailsHtml}
            </div>

            <div class="card">
              <div class="card-title">Expense Breakdown</div>
              ${expenseDetailsHtml}
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Loading paystub...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 p-8 text-white shadow-xl xl:col-span-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
            Driver Paystub
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {username || "Driver"} payroll summary
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            View your real pay details from assigned loads and recorded expenses,
            then print a professional paystub PDF.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Gross Pay
              </p>
              <p className="mt-2 text-2xl font-bold">${grossPay.toFixed(2)}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Expenses
              </p>
              <p className="mt-2 text-2xl font-bold">${totalExpenses.toFixed(2)}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Net Pay
              </p>
              <p className="mt-2 text-2xl font-bold">${netPay.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Summary
          </p>

          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Total Loads
              </p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {loads.length}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Total Miles
              </p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {totalMiles.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Net Pay
              </p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                ${netPay.toFixed(2)}
              </p>
            </div>

            <button
              onClick={generatePDF}
              className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Generate PDF
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              My Loads
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Load Breakdown
            </h2>
          </div>

          {loads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-lg font-semibold text-slate-700">No loads found</p>
              <p className="mt-2 text-sm text-slate-500">
                No assigned loads are currently in the system.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {loads.map((load) => (
                <div
                  key={load.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {load.pickupLocation || "-"} → {load.deliveryLocation || "-"}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Load #{load.loadNumber || "-"}
                      </p>
                    </div>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      ${Number(load.rate || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Miles
                      </p>
                      <p className="mt-2 font-bold text-slate-900">
                        {Number(load.totalMiles || 0).toLocaleString()}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Status
                      </p>
                      <p className="mt-2 font-bold text-slate-900">
                        {load.status || "Pending"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              My Expenses
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Expense Breakdown
            </h2>
          </div>

          {expenseBreakdown.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-lg font-semibold text-slate-700">No expenses found</p>
              <p className="mt-2 text-sm text-slate-500">
                No driver expenses are currently assigned to you.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenseBreakdown.map((item) => (
                <div
                  key={item.name}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      ${item.amount.toLocaleString()}
                    </span>
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