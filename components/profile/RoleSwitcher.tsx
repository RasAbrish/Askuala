"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function RoleSwitcher({ currentRole }: { currentRole: "student" | "teacher" | "admin" }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const nextRole = currentRole === "teacher" ? "student" : "teacher";

  async function switchRole() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to switch role");
      setMessage(`Role updated to ${nextRole}. Refreshing...`);
      window.location.reload();
    } catch (err: any) {
      setMessage(err.message || "Could not switch role.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h3 className="text-base font-semibold text-ink">Role</h3>
      <p className="mt-1 text-sm text-ink/60">Current role: {currentRole}</p>
      <Button className="mt-3" onClick={switchRole} disabled={loading}>
        {loading ? "Switching..." : `Switch to ${nextRole}`}
      </Button>
      {message && <p className="mt-2 text-sm text-ink/70">{message}</p>}
    </div>
  );
}
