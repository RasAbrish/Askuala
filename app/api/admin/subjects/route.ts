import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  name: z.string().min(2).max(100),
  grade: z.number().int().min(9).max(12),
});

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { userId: user.id };
}

export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;
  const admin = createAdminClient();
  const { data, error } = await admin.from("subjects").select("id,name,grade").order("grade", { ascending: true }).order("name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subjects: data ?? [] });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const admin = createAdminClient();
  const { data, error } = await admin.from("subjects").insert(parsed.data).select("id,name,grade").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subject: data }, { status: 201 });
}
