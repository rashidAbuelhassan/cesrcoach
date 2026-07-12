import { createClient } from "@/lib/supabase/server";
import { getBranding } from "@/lib/settings";
import Logo from "./Logo";
import NavMenu from "./NavMenu";

export default async function Navbar() {
  const supabase = await createClient();
  const branding = await getBranding();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("coach_profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin";
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
      <div className="glass mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 sm:px-6">
        <Logo logoUrl={branding.logoUrl} siteName={branding.siteName} />
        <NavMenu signedIn={!!user} isAdmin={isAdmin} />
      </div>
    </header>
  );
}
