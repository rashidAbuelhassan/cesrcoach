import { createClient } from "@/lib/supabase/server";
import VideoManager from "@/components/admin/VideoManager";
import type { Video } from "@/lib/types";

export const metadata = { title: "Videos · Admin" };

export default async function AdminVideosPage() {
  const supabase = await createClient();
  const { data: videos } = await supabase
    .from("coach_videos")
    .select("*")
    .order("sort_order")
    .order("created_at", { ascending: false });

  return <VideoManager videos={(videos as Video[]) ?? []} />;
}
