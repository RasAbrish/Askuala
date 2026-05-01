import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminIntegrationsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/dashboard");

  return (
    <div className="space-y-6">
      <section className="card">
        <h1 className="text-2xl font-bold text-ink">Integrations</h1>
        <p className="mt-1 text-sm text-ink/60">Configure external channels and API credentials.</p>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold text-ink">Telegram Setup</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-ink/70">
          <li>Open Telegram and start chat with BotFather.</li>
          <li>Run <code>/newbot</code> and copy your bot token.</li>
          <li>Set <code>TELEGRAM_BOT_TOKEN</code> in <code>.env.local</code>.</li>
          <li>Set <code>TELEGRAM_WEBHOOK_SECRET</code> in <code>.env.local</code>.</li>
          <li>Run <code>npm run bot:telegram</code> for local polling mode.</li>
          <li>For production, point webhook to your deployment URL.</li>
        </ol>
      </section>
    </div>
  );
}
