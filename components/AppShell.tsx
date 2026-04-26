"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setRole(localStorage.getItem("role"));
  }, [pathname]);

  // Login page: no sidebar
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Important: same render before browser loads
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-100">
        <main className="p-6">{children}</main>
      </div>
    );
  }

  function navItem(href: string, label: string) {
    const active = pathname === href;

    return (
      <Link
        href={href}
        className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
          active
            ? "bg-white text-slate-900"
            : "text-white/80 hover:bg-white/10 hover:text-white"
        }`}
      >
        {label}
      </Link>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col bg-slate-950 p-4 text-white lg:flex">
        <div>
          <h1 className="text-lg font-bold">Mission Haul</h1>
          <p className="text-xs text-white/60">Dispatch • Finance • Payroll</p>
        </div>

        <div className="mt-6 rounded-2xl bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
            Logged in as
          </p>
          <p className="mt-2 text-sm font-bold">
            {role === "admin" ? "Admin" : role === "driver" ? "Driver" : "User"}
          </p>
          <p className="text-xs text-slate-400">{role || "No role"}</p>
        </div>

        <nav className="mt-8 flex-1 space-y-2">
          {role === "admin" && (
            <>
              {navItem("/", "Dashboard")}
              {navItem("/drivers", "Drivers")}
              {navItem("/users", "Users")}
              {navItem("/vehicles", "Vehicles")}
              {navItem("/loads", "Loads")}
              {navItem("/expenses", "Expenses")}
              {navItem("/settlements", "Settlements")}
              {navItem("/reports", "Reports")}
            </>
          )}

          {role === "driver" && (
            <>
              {navItem("/driver-dashboard", "My Dashboard")}
              {navItem("/driver-history", "My History")}
              {navItem("/driver-paystub", "My Paystub")}
            </>
          )}
        </nav>

        <div className="border-t border-white/10 pt-4">
          <LogoutButton />
        </div>
      </aside>

      <main className="min-h-screen w-full p-4 lg:ml-64 lg:p-8">
        {children}
      </main>
    </div>
  );
}