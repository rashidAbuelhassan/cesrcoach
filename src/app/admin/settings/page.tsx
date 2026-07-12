import { createClient } from "@/lib/supabase/server";
import SettingsManager from "@/components/admin/SettingsManager";
import type { Consultant } from "@/lib/types";

export const metadata = { title: "Settings · Admin" };

export default async function AdminSettingsPage() {
  const supabase = await createClient();

  const [{ data: settings }, { data: consultants }] = await Promise.all([
    supabase.from("coach_settings").select("*"),
    supabase.from("coach_consultants").select("*").order("sort_order"),
  ]);

  const map: Record<string, Record<string, unknown>> = {};
  for (const s of settings ?? []) map[s.key] = s.value;

  return (
    <SettingsManager
      siteName={(map.site_name?.text as string) ?? "CESR Coach"}
      logoUrl={(map.logo_url?.url as string) ?? null}
      contactEmail={(map.contact_email?.text as string) ?? ""}
      adminEmails={((map.admin_emails?.emails as string[]) ?? []).join(", ")}
      consultants={(consultants as Consultant[]) ?? []}
    />
  );
}
