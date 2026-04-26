"use client";

import { useEffect, useState } from "react";
import AuthGuard from "../../components/AuthGuard";

type User = {
  id: string;
  username: string;
  role: string;
  driverName?: string | null;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "driver",
    driverName: "",
  });

  async function loadUsers() {
    const res = await fetch("/api/users", { cache: "no-store" });
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function saveUser() {
    if (!form.username) {
      alert("Username required");
      return;
    }

    const url = editingId ? `/api/users/${editingId}` : "/api/auth/register";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed");
      return;
    }

    setEditingId(null);
    setForm({ username: "", password: "", role: "driver", driverName: "" });
    loadUsers();
  }

  function startEdit(user: User) {
    setEditingId(user.id);
    setForm({
      username: user.username,
      password: "",
      role: user.role,
      driverName: user.driverName || "",
    });
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this user?")) return;

    const res = await fetch(`/api/users/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Delete failed");
      return;
    }

    loadUsers();
  }

  return (
    <AuthGuard allowedRole="admin">
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            {editingId ? "Edit User" : "Create User"}
          </h1>

          <div className="mt-5 grid gap-3">
            <input
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />

            <input
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              placeholder={editingId ? "New password optional" : "Password"}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <select
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="driver">Driver</option>
              <option value="admin">Admin</option>
            </select>

            <input
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              placeholder="Driver name"
              value={form.driverName}
              onChange={(e) => setForm({ ...form, driverName: e.target.value })}
            />

            <div className="flex gap-2">
              <button
                onClick={saveUser}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                {editingId ? "Update User" : "Create User"}
              </button>

              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setForm({
                      username: "",
                      password: "",
                      role: "driver",
                      driverName: "",
                    });
                  }}
                  className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Users List</h2>

          <div className="mt-5 space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div>
                  <p className="font-bold text-slate-900">{user.username}</p>
                  <p className="text-sm text-slate-500">
                    {user.role} {user.driverName ? `• ${user.driverName}` : ""}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(user)}
                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteUser(user.id)}
                    className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}