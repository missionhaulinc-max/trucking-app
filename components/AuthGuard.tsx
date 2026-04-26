"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthGuard({
  children,
  allowedRole,
}: {
  children: React.ReactNode;
  allowedRole?: "admin" | "driver";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("role");

    // ❌ Not logged in
    if (!role) {
      router.push("/login");
      return;
    }

    // ❌ Wrong role
    if (allowedRole && role !== allowedRole) {
      router.push("/login");
      return;
    }

    setLoading(false);
  }, [router, allowedRole]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-500">
        Checking access...
      </div>
    );
  }

  return <>{children}</>;
}