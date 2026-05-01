import Link from "next/link";
import { PremiumPlans } from "@/components/teacher/PremiumPlans";

export default function TeacherPremiumPage() {
  return (
    <div className="space-y-6">
      <section className="card">
        <h1 className="text-2xl font-bold text-ink">Premium Tier</h1>
        <p className="mt-1 text-sm text-ink/60">
          Unlock advanced AI generation and deeper analytics for school-level deployment.
        </p>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold text-ink">Plans</h2>
        <PremiumPlans />
        <p className="text-xs text-ink/50">
          If upgrade fails, run <code>supabase/patch-phase4.sql</code> in Supabase SQL editor first.
        </p>
        <div>
          <Link href="/teacher/dashboard" className="btn-ghost">Back to Dashboard</Link>
        </div>
      </section>
    </div>
  );
}
