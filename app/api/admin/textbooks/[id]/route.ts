import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  subject_id: z.string().uuid().optional(),
  title: z.string().min(2).max(200).optional(),
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

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const admin = createAdminClient();
  const { error } = await admin.from("textbooks").update(parsed.data).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;
  const admin = createAdminClient();
  const { error } = await admin.from("textbooks").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
