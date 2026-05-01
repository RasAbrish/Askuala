import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  subject_id: z.string().uuid(),
  title: z.string().min(2).max(200),
  pdf_url: z.string().url().nullable().optional(),
  total_pages: z.number().int().min(1).max(10000).nullable().optional(),
});

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { ok: true };
}

export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("textbooks")
    .select("id,subject_id,title,pdf_url,total_pages")
    .order("uploaded_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ textbooks: data ?? [] });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("textbooks")
    .insert(parsed.data)
    .select("id,subject_id,title,pdf_url,total_pages")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ textbook: data }, { status: 201 });
}
