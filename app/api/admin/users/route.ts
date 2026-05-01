import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
  fullName: z.string().trim().min(2).max(120),
  role: z.enum(["student", "teacher", "admin"]),
  grade: z.number().int().min(9).max(12).nullable().optional(),
});

const updateSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email().optional(),
  fullName: z.string().trim().min(2).max(120).optional(),
  role: z.enum(["student", "teacher", "admin"]).optional(),
  grade: z.number().int().min(9).max(12).nullable().optional(),
  newPassword: z.string().min(6).max(128).optional(),
});

const deleteSchema = z.object({
  userId: z.string().uuid(),
});

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user };
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { email, password, fullName, role, grade } = parsed.data;
  const admin = createAdminClient();

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
      grade: grade === null || grade === undefined ? "" : String(grade),
      language_pref: "en",
    },
  });

  if (created.error || !created.data.user) {
    return NextResponse.json({ error: created.error?.message ?? "Failed to create user" }, { status: 500 });
  }

  const uid = created.data.user.id;
  const upsert = await admin.from("profiles").upsert(
    {
      id: uid,
      email,
      full_name: fullName,
      role,
      grade: grade ?? null,
      language_pref: "en",
    },
    { onConflict: "id" },
  );

  if (upsert.error) {
    return NextResponse.json({ error: upsert.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userId: uid });
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { userId, email, fullName, role, grade, newPassword } = parsed.data;
  if (userId === gate.user.id && role && role !== "admin") {
    return NextResponse.json({ error: "Admin cannot remove own admin role." }, { status: 400 });
  }

  const admin = createAdminClient();

  const profilePatch: Record<string, unknown> = {};
  if (email !== undefined) profilePatch.email = email;
  if (fullName !== undefined) profilePatch.full_name = fullName;
  if (role !== undefined) profilePatch.role = role;
  if (grade !== undefined) profilePatch.grade = grade;

  if (Object.keys(profilePatch).length > 0) {
    const profileRes = await admin.from("profiles").update(profilePatch).eq("id", userId);
    if (profileRes.error) {
      return NextResponse.json({ error: profileRes.error.message }, { status: 500 });
    }
  }

  if (email !== undefined || fullName !== undefined || role !== undefined || grade !== undefined || newPassword !== undefined) {
    const authPatch: Record<string, unknown> = {};
    if (email !== undefined) authPatch.email = email;
    if (newPassword !== undefined) authPatch.password = newPassword;

    const userMeta: Record<string, unknown> = {};
    if (fullName !== undefined) userMeta.full_name = fullName;
    if (role !== undefined) userMeta.role = role;
    if (grade !== undefined) userMeta.grade = grade === null ? "" : String(grade);
    if (Object.keys(userMeta).length > 0) authPatch.user_metadata = userMeta;

    const authRes = await admin.auth.admin.updateUserById(userId, authPatch as any);
    if (authRes.error) {
      return NextResponse.json({ error: authRes.error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const parsed = deleteSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { userId } = parsed.data;
  if (userId === gate.user.id) {
    return NextResponse.json({ error: "Admin cannot delete own account." }, { status: 400 });
  }

  const admin = createAdminClient();
  const deleted = await admin.auth.admin.deleteUser(userId);
  if (deleted.error) {
    return NextResponse.json({ error: deleted.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
