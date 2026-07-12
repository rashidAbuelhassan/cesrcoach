import { createClient } from "@/lib/supabase/server";
import VideoGrid from "@/components/members/VideoGrid";
import type { Video } from "@/lib/types";

export const metadata = { title: "Video library" };

export default async function VideosPage() {
  const supabase = await createClient();
  const { data: videos } = await supabase
    .from("coach_videos")
    .select("*")
    .eq("published", true)
    .order("sort_order")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 pb-8">
      <header>
        <h1 className="text-3xl font-bold">🎬 Video library</h1>
        <p className="mt-2 text-mist/60">
          Pre-recorded presentations from our consultants — watch any time, as
          often as you need.
        </p>
      </header>
      <VideoGrid videos={(videos as Video[]) ?? []} />
    </div>
  );
}
