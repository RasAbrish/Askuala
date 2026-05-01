import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = (await req.json()) as { plan?: "free" | "premium_teacher" | "premium_school" };
  if (!plan) return NextResponse.json({ error: "Plan is required." }, { status: 400 });

  const admin = createAdminClient();

  const { error } = await admin.from("subscriptions").upsert(
    {
      owner_id: user.id,
      plan,
      status: "active",
      started_at: new Date().toISOString(),
    },
    { onConflict: "owner_id" },
  );

  if (error) {
    return NextResponse.json(
      {
        error:
          "Subscriptions table is missing. Run supabase/patch-phase4.sql first, then retry upgrade.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, plan });
}
