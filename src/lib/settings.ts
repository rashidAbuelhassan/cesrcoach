import { createClient } from "@/lib/supabase/server";
import { site } from "@/config/site";

export interface SiteBranding {
  siteName: string;
  logoUrl: string | null;
  contactEmail: string;
  priceNote: string;
}

/** Public branding settings, admin-overridable from the settings page. */
export async function getBranding(): Promise<SiteBranding> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("coach_settings")
      .select("key, value")
      .in("key", ["site_name", "logo_url", "contact_email", "price_note"]);

    const map = new Map(data?.map((s) => [s.key, s.value]) ?? []);
    return {
      siteName: (map.get("site_name")?.text as string) || site.name,
      logoUrl: (map.get("logo_url")?.url as string) || null,
      contactEmail: (map.get("contact_email")?.text as string) || site.contactEmail,
      priceNote: (map.get("price_note")?.text as string) || "",
    };
  } catch {
    return {
      siteName: site.name,
      logoUrl: null,
      contactEmail: site.contactEmail,
      priceNote: "",
    };
  }
}
