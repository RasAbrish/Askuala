"use client";

import { useState } from "react";

export function PremiumPlans() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<"premium_teacher" | "premium_school" | null>(null);

  async function upgrade(plan: "premium_teacher" | "premium_school") {
    setLoading(plan);
    setMessage(null);
    try {
      const res = await fetch("/api/premium/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error || "Upgrade failed");
      setMessage(`Plan updated to ${plan}.`);
    } catch (err: any) {
      setMessage(err.message || "Upgrade failed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        className="card text-left"
        onClick={() => upgrade("premium_teacher")}
        disabled={loading !== null}
      >
        <p className="font-semibold">Premium Teacher</p>
        <p className="text-sm text-ink/60">Advanced generation controls, richer reports, priority analytics.</p>
        <p className="mt-2 text-xs text-primary">{loading === "premium_teacher" ? "Upgrading..." : "Choose plan"}</p>
      </button>
      <button
        className="card text-left"
        onClick={() => upgrade("premium_school")}
        disabled={loading !== null}
      >
        <p className="font-semibold">Premium School</p>
        <p className="text-sm text-ink/60">Multi-teacher insights, NGO/ministry-ready exports, institution analytics.</p>
        <p className="mt-2 text-xs text-primary">{loading === "premium_school" ? "Upgrading..." : "Choose plan"}</p>
      </button>
      {message && <p className="text-sm text-ink/70 sm:col-span-2">{message}</p>}
    </div>
  );
}
