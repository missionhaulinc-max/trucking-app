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
  pickupDate?: string;
  deliveryDate?: string;
  pickupLocation?: string;
  deliveryLocation?: string;
  rate?: number | null;
  driver?: string;
  truck?: string;
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

export default function PaystubPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const [driverName, setDriverName] = useState("");
  const [driverType, setDriverType] = useState("Company Driver");
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [driversRes, loadsRes, expensesRes] = await Promise.all([
          fetch("/api/drivers"),
          fetch("/api/loads"),
          fetch("/api/expenses"),
        ]);

        const driversData = await driversRes.json();
        const loadsData = await loadsRes.json();
        const expensesData = await expensesRes.json();

        setDrivers(Array.isArray(driversData) ? driversData : []);
        setLoads(Array.isArray(loadsData) ? loadsData : []);
        setExpenses(Array.isArray(expensesData) ? expensesData : []);
      } catch (error) {
        console.error("Paystub fetch error:", error);
        setDrivers([]);
        setLoads([]);
        setExpenses([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredLoads = useMemo(() => {
    if (!driverName || !weekStart || !weekEnd) return [];

    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    end.setHours(23, 59, 59, 999);

    return loads.filter((load) => {
      const loadDate = load.pickupDate ? new Date(load.pickupDate) : null;

      return (
        load.driver === driverName &&
        loadDate &&
        loadDate >= start &&
        loadDate <= end
      );
    });
  }, [loads, driverName, weekStart, weekEnd]);

  const filteredExpenses = useMemo(() => {
    if (!driverName || !weekStart || !weekEnd) return [];

    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    end.setHours(23, 59, 59, 999);

    return expenses.filter((expense) => {
      const expenseDate = expense.createdAt ? new Date(expense.createdAt) : null;

      return (
        expense.driver === driverName &&
        expenseDate &&
        expenseDate >= start &&
        expenseDate <= end
      );
    });
  }, [expenses, driverName, weekStart, weekEnd]);

  const totalMiles = filteredLoads.reduce(
    (sum, load) => sum + Number(load.totalMiles || 0),
    0
  );

  const grossPay = filteredLoads.reduce(
    (sum, load) => sum + Number(load.rate || 0),
    0
  );

  const totalExpenses = filteredExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  const dispatchFee = driverType === "Owner Operator" ? grossPay * 0.1 : 0;
  const netPay = grossPay - totalExpenses - dispatchFee;

  const expenseBreakdown = useMemo(() => {
    const map = new Map<string, number>();

    for (const item of filteredExpenses) {
      const key = item.category || "Other";
      map.set(key, (map.get(key) || 0) + Number(item.amount || 0));
    }

    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  const generatePDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const loadDetailsHtml =
      filteredLoads.length > 0
        ? filteredLoads
            .map(
              (load) => `
                <div class="row">
                  <span>
                    ${load.loadNumber || "-"} | ${load.pickupLocation || "-"} → ${load.deliveryLocation || "-"}
                  </span>
                  <span class="value">
                    $${Number(load.rate || 0).toFixed(2)}
                  </span>
                </div>
              `
            )
            .join("")
        : `<div class="row"><span>No loads found for selected week</span><span class="value">-</span></div>`;

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
        : `<div class="row"><span>No expenses found for selected week</span><span class="value">$0.00</span></div>`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Paystub</title>
          <style>
            * {
              box-sizing: border-box;
            }
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
            .note-box {
              border: 1px solid #e5e7eb;
              border-radius: 18px;
              padding: 18px;
              background: #ffffff;
              margin-top: 20px;
            }
            .signature-wrap {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 30px;
              margin-top: 40px;
            }
            .signature-line {
              border-top: 1px solid #94a3b8;
              padding-top: 10px;
              font-size: 13px;
              color: #475569;
            }
            @media print {
              body {
                padding: 16px;
              }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="hero">
              <div class="hero-title">Mission Haul Inc</div>
              <div class="hero-sub">Professional Driver Paystub / Settlement Summary</div>
            </div>

            <div class="grid">
              <div class="card">
                <div class="card-title">Driver Information</div>
                <div class="row"><span>Driver Name</span><span class="value">${driverName || "-"}</span></div>
                <div class="row"><span>Driver Type</span><span class="value">${driverType}</span></div>
                <div class="row"><span>Week Start</span><span class="value">${weekStart || "-"}</span></div>
                <div class="row"><span>Week End</span><span class="value">${weekEnd || "-"}</span></div>
              </div>

              <div class="card">
                <div class="card-title">Pay Information</div>
                <div class="row"><span>Pay Date</span><span class="value">${new Date().toLocaleDateString()}</span></div>
                <div class="row"><span>Total Miles</span><span class="value">${totalMiles.toLocaleString()}</span></div>
                <div class="row"><span>Gross Pay</span><span class="value">$${grossPay.toFixed(2)}</span></div>
                <div class="row"><span>Total Deductions</span><span class="value">$${(totalExpenses + dispatchFee).toFixed(2)}</span></div>
              </div>
            </div>

            <div class="stats">
              <div class="stat">
                <div class="stat-label">Gross Pay</div>
                <div class="stat-value">$${grossPay.toFixed(2)}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Deductions</div>
                <div class="stat-value">$${(totalExpenses + dispatchFee).toFixed(2)}</div>
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
              <div class="row">
                <span>Dispatch Fee</span>
                <span class="value">$${dispatchFee.toFixed(2)}</span>
              </div>
            </div>

            <div class="note-box">
              <div class="card-title">Notes</div>
              <div>${notes || "-"}</div>
            </div>

            <div class="signature-wrap">
              <div class="signature-line">Driver Signature</div>
              <div class="signature-line">Authorized Company Signature</div>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 p-8 text-white shadow-xl xl:col-span-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
            Auto Paystub Generator
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Select driver and week to automatically calculate paystub totals.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Pull real load revenue, miles, weekly expenses, and dispatch fee automatically
            from your existing records to build a more professional paystub.
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
                Weekly Expenses
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
                Driver
              </p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {driverName || "-"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Total Loads
              </p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {filteredLoads.length}
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
                Driver Type
              </p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {driverType}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Paystub Setup
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Select Driver and Week
            </h2>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
              Loading paystub data...
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Driver
                </label>
                <select
                  value={driverName}
                  onChange={(e) => {
                    const selected = drivers.find((d) => d.name === e.target.value);
                    setDriverName(e.target.value);
                    setDriverType(selected?.driverType || "Company Driver");
                  }}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                >
                  <option value="">Select Driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.name}>
                      {driver.name} {driver.driverType ? `(${driver.driverType})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Driver Type
                </label>
                <input
                  value={driverType}
                  readOnly
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Week Start
                </label>
                <input
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Week End
                </label>
                <input
                  type="date"
                  value={weekEnd}
                  onChange={(e) => setWeekEnd(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Extra notes for this paystub"
                  rows={4}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-700">Load Summary</p>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Total Loads</span>
                  <span className="font-semibold">{filteredLoads.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Miles</span>
                  <span className="font-semibold">{totalMiles.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Gross Revenue</span>
                  <span className="font-semibold">${grossPay.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-700">Expense Summary</p>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Total Expenses</span>
                  <span className="font-semibold">${totalExpenses.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Dispatch Fee</span>
                  <span className="font-semibold">${dispatchFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Net Pay</span>
                  <span className="font-semibold">${netPay.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Live Preview
          </p>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Gross Pay
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                ${grossPay.toFixed(2)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Total Deductions
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                ${(totalExpenses + dispatchFee).toFixed(2)}
              </p>
            </div>

            <div className="rounded-2xl bg-blue-600 p-4 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-100">
                Net Pay
              </p>
              <p className="mt-2 text-3xl font-bold">
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
    </div>
  );
}