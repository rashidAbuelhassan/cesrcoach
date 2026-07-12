import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/members/ProfileForm";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("coach_profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <div className="space-y-6 pb-8">
      <header>
        <h1 className="text-3xl font-bold">👤 Your profile</h1>
        <p className="mt-2 text-mist/60">
          Keep your details current — they help us tailor your sessions.
        </p>
      </header>
      <ProfileForm profile={profile as Profile} />
    </div>
  );
}
