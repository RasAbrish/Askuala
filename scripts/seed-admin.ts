import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

function required(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} is required`);
  return v;
}

async function main() {
  const url = required("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRole = required("SUPABASE_SERVICE_ROLE_KEY");
  const email = required("DEFAULT_ADMIN_EMAIL").toLowerCase();
  const password = required("DEFAULT_ADMIN_PASSWORD");
  const fullName = (process.env.DEFAULT_ADMIN_NAME ?? "Default Admin").trim();

  const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });

  const listed = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listed.error) throw listed.error;

  let user = listed.data.users.find((u) => (u.email ?? "").toLowerCase() === email) ?? null;

  if (!user) {
    const created = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "admin",
        language_pref: "en",
      },
    });
    if (created.error) throw created.error;
    user = created.data.user;
    console.log(`[seed-admin] Created auth user: ${email}`);
  } else {
    console.log(`[seed-admin] Auth user exists: ${email}`);
  }

  if (!user) throw new Error("Failed to ensure admin auth user.");

  const updated = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(user.user_metadata ?? {}),
      full_name: fullName,
      role: "admin",
      language_pref: "en",
    },
  });
  if (updated.error) throw updated.error;

  const profileUpsert = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email,
        full_name: fullName,
        role: "admin",
        grade: null,
        language_pref: "en",
      },
      { onConflict: "id" },
    );
  if (profileUpsert.error) throw profileUpsert.error;

  const profileRoleFix = await supabase
    .from("profiles")
    .update({ role: "admin", email, full_name: fullName, language_pref: "en" })
    .eq("id", user.id);
  if (profileRoleFix.error) throw profileRoleFix.error;

  console.log(`[seed-admin] Admin ensured: ${email}`);
}

main().catch((err) => {
  console.error("[seed-admin] failed", err);
  process.exit(1);
});
