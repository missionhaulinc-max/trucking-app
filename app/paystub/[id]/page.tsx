"use client";

import { useEffect, useMemo, useState } from "react";

type LoadDetail = {
  id: string;
  loadNumber: string;
  pickupLocation: string;
  deliveryLocation: string;
  totalMiles: number;
  rate: number;
  status: string;
};

type ExpenseDetail = {
  id: string;
  category: string;
  amount: number;
  driver: string;
  truck: string;
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
  loadDetails?: string | null;
  expenseDetails?: string | null;
};

function money(value?: number | null) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function niceDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default function PaystubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [settlementId, setSettlementId] = useState("");
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setSettlementId(p.id));
  }, [params]);

  useEffect(() => {
    if (!settlementId) return;

    async function fetchSettlement() {
      try {
        const res = await fetch("/api/settlements", { cache: "no-store" });
        const data = await res.json();

        const found = Array.isArray(data)
          ? data.find((item) => item.id === settlementId)
          : null;

        setSettlement(found || null);
      } catch (error) {
        console.error("Paystub fetch error:", error);
        setSettlement(null);
      } finally {
        setLoading(false);
      }
    }

    fetchSettlement();
  }, [settlementId]);

  const loads = useMemo<LoadDetail[]>(() => {
    if (!settlement?.loadDetails) return [];
    try {
      const parsed = JSON.parse(settlement.loadDetails);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [settlement]);

  const expenses = useMemo<ExpenseDetail[]>(() => {
    if (!settlement?.expenseDetails) return [];
    try {
      const parsed = JSON.parse(settlement.expenseDetails);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [settlement]);

  const totalLoadRevenue = useMemo(() => {
    return loads.reduce((sum, load) => sum + Number(load.rate || 0), 0);
  }, [loads]);

  const totalLoadMiles = useMemo(() => {
    return loads.reduce((sum, load) => sum + Number(load.totalMiles || 0), 0);
  }, [loads]);

  const totalExpenseAmount = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }, [expenses]);

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Loading paystub...</div>;
  }

  if (!settlement) {
    return <div className="p-6 text-sm text-slate-500">Paystub not found.</div>;
  }

  return (
    <div className="mx-auto max-w-6xl bg-slate-100 p-4 sm:p-6 print:bg-white print:p-0">
      <div className="mb-4 flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
        >
          Print / Save PDF
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <div className="border-b border-slate-200 px-6 py-6 print:px-0">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Mission Haul Inc
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                Driver Settlement Paystub
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Weekly settlement statement
              </p>
            </div>

            <div className="grid gap-3 sm:min-w-70">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  Paystub ID
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {settlement.paystubId || settlement.id}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  Pay Date
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {niceDate(settlement.payDate)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 border-b border-slate-200 px-6 py-6 md:grid-cols-2 xl:grid-cols-4 print:px-0">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
              Driver Name
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {settlement.driverName || "-"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
              Driver Type
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {settlement.driverType || "-"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
              Week Start
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {niceDate(settlement.weekStart)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
              Week End
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {niceDate(settlement.weekEnd)}
            </p>
          </div>
        </div>

        <div className="grid gap-6 border-b border-slate-200 px-6 py-6 lg:grid-cols-3 print:px-0">
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Load Summary
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Loads</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{loads.length}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Miles</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {totalLoadMiles.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Revenue</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {money(totalLoadRevenue)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Financial Summary
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Gross</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {money(settlement.grossAmount)}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Expenses</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {money(settlement.totalExpense)}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Dispatch Fee</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {money(settlement.dispatchFee)}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-600">Net Pay</p>
                <p className="mt-2 text-3xl font-bold text-emerald-700">
                  {money(settlement.netAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200 px-6 py-6 print:px-0">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Load Details
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Included Loads
            </h2>
          </div>

          {loads.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
              No loads attached to this settlement.
            </div>
          ) : (
            <>
              <div className="space-y-3 sm:hidden">
                {loads.map((load) => (
                  <div
                    key={load.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          Load #{load.loadNumber}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {load.pickupLocation} → {load.deliveryLocation}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-slate-900">
                        {money(load.rate)}
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-[10px] uppercase text-slate-400">Miles</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {Number(load.totalMiles || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-[10px] uppercase text-slate-400">Status</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {load.status || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Load #
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Route
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Miles
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Status
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loads.map((load) => (
                      <tr key={load.id} className="border-b border-slate-100">
                        <td className="px-3 py-4 text-sm font-semibold text-slate-900">
                          #{load.loadNumber}
                        </td>
                        <td className="px-3 py-4 text-sm text-slate-700">
                          {load.pickupLocation} → {load.deliveryLocation}
                        </td>
                        <td className="px-3 py-4 text-sm text-slate-700">
                          {Number(load.totalMiles || 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-4 text-sm text-slate-700">
                          {load.status || "-"}
                        </td>
                        <td className="px-3 py-4 text-right text-sm font-bold text-slate-900">
                          {money(load.rate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="border-b border-slate-200 px-6 py-6 print:px-0">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Expense Details
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Deductions and Expenses
            </h2>
          </div>

          {expenses.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
              No expense details attached to this settlement.
            </div>
          ) : (
            <>
              <div className="space-y-3 sm:hidden">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {expense.category}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Driver: {expense.driver}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-slate-900">
                        {money(expense.amount)}
                      </p>
                    </div>

                    <div className="mt-3 rounded-xl bg-white p-3">
                      <p className="text-[10px] uppercase text-slate-400">Truck</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {expense.truck}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Category
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Driver
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Truck
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="border-b border-slate-100">
                        <td className="px-3 py-4 text-sm font-semibold text-slate-900">
                          {expense.category}
                        </td>
                        <td className="px-3 py-4 text-sm text-slate-700">
                          {expense.driver}
                        </td>
                        <td className="px-3 py-4 text-sm text-slate-700">
                          {expense.truck}
                        </td>
                        <td className="px-3 py-4 text-right text-sm font-bold text-slate-900">
                          {money(expense.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-900 p-4 text-white">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Total Expenses</p>
                  <p className="text-xl font-bold">{money(totalExpenseAmount)}</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-6 print:px-0">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Signature
              </p>
              <div className="mt-8 border-t border-slate-400 pt-2 text-sm text-slate-600">
                Authorized Signature
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950 p-6 text-white">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                Final Net Pay
              </p>
              <p className="mt-3 text-4xl font-bold">
                {money(settlement.netAmount)}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Generated from recorded loads, deductions, and settlement calculations.
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Mission Haul Inc • Driver Settlement Statement • Generated {niceDate(new Date().toISOString())}
          </p>
        </div>
      </div>
    </div>
  );
}