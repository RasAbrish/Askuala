import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const roleSchema = z.object({
  role: z.enum(["student", "teacher"]),
});

export async function PATCH(req: NextRequest) {
  if (process.env.ENABLE_ROLE_SWITCH !== "true") {
    return NextResponse.json(
      { error: "Role switch is disabled. Set ENABLE_ROLE_SWITCH=true for local testing." },
      { status: 403 },
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = roleSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, role: parsed.data.role });
}
