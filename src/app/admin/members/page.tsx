import { createClient } from "@/lib/supabase/server";
import MemberManager from "@/components/admin/MemberManager";
import type { Booking, Profile } from "@/lib/types";

export const metadata = { title: "Candidates · Admin" };

export default async function AdminMembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profiles }, { data: bookings }] = await Promise.all([
    supabase
      .from("coach_profiles")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("coach_bookings")
      .select("*, coach_events(*, coach_event_types(*))")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <MemberManager
      profiles={(profiles as Profile[]) ?? []}
      bookings={(bookings as Booking[]) ?? []}
      currentUserId={user!.id}
    />
  );
}
