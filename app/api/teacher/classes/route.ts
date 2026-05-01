import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  name: z.string().min(2).max(120),
  grade: z.number().int().min(9).max(12),
  subject_id: z.string().uuid().nullable().optional(),
});

async function requireTeacher() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!(me?.role === "teacher" || me?.role === "admin")) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { userId: user.id };
}

export async function GET() {
  const gate = await requireTeacher();
  if ("error" in gate) return gate.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("classes")
    .select("id,name,grade,subject_id,teacher_id,school_id")
    .eq("teacher_id", gate.userId)
    .order("name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ classes: data ?? [] });
}

export async function POST(req: Request) {
  const gate = await requireTeacher();
  if ("error" in gate) return gate.error;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const admin = createAdminClient();
  const { data: me } = await admin.from("profiles").select("school_id").eq("id", gate.userId).single();
  const payload = {
    ...parsed.data,
    teacher_id: gate.userId,
    school_id: me?.school_id ?? null,
  };

  const { data, error } = await admin.from("classes").insert(payload).select("id,name,grade,subject_id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ class: data }, { status: 201 });
}
