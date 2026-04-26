"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AppUser = {
  username: string;
  password: string;
  role: "admin" | "driver";
  driverName?: string;
};

const USERS: AppUser[] = [
  {
    username: "admin",
    password: "1234",
    role: "admin",
  },
  {
    username: "wasim",
    password: "1111",
    role: "driver",
    driverName: "wasim",
  },
  {
    username: "zakir",
    password: "2222",
    role: "driver",
    driverName: "zakir",
  },
];

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const matchedUser = USERS.find(
      (user) =>
        user.username.trim().toLowerCase() === username.trim().toLowerCase() &&
        user.password === password
    );

    if (!matchedUser) {
      setError("Wrong username or password");
      return;
    }

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("role", matchedUser.role);
    localStorage.setItem("username", matchedUser.username);

    if (matchedUser.driverName) {
      localStorage.setItem("driverName", matchedUser.driverName);
    } else {
      localStorage.removeItem("driverName");
    }

    if (matchedUser.role === "admin") {
      router.push("/");
    } else {
      router.push("/driver-dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl sm:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Mission Haul</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enterprise Dispatch System
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
            required
          />

          {error ? (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Login
          </button>
        </form>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p><strong>Admin:</strong> admin / 1234</p>
          <p><strong>Driver 1:</strong> wasim / 1111</p>
          <p><strong>Driver 2:</strong> zakir / 2222</p>
        </div>
      </div>
    </div>
  );
}