import { createClient } from "@/lib/supabase/server";
import MemberManager from "@/components/admin/MemberManager";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Members · Admin" };

export default async function AdminMembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profiles } = await supabase
    .from("coach_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <MemberManager
      profiles={(profiles as Profile[]) ?? []}
      currentUserId={user!.id}
    />
  );
}
