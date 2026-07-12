import { createClient } from "@/lib/supabase/server";
import EventManager from "@/components/admin/EventManager";
import type { CoachEvent, EventType } from "@/lib/types";

export const metadata = { title: "Sessions · Admin" };

export default async function AdminEventsPage() {
  const supabase = await createClient();

  const [{ data: eventTypes }, { data: events }, { data: counts }] =
    await Promise.all([
      supabase.from("coach_event_types").select("*").order("sort_order"),
      supabase
        .from("coach_events")
        .select("*, coach_event_types(*)")
        .order("starts_at", { ascending: false }),
      supabase.rpc("coach_event_booked_counts"),
    ]);

  const bookedCounts: Record<string, number> = {};
  for (const row of (counts as { event_id: string; booked: number }[]) ?? []) {
    bookedCounts[row.event_id] = Number(row.booked);
  }

  return (
    <EventManager
      eventTypes={(eventTypes as EventType[]) ?? []}
      events={(events as CoachEvent[]) ?? []}
      bookedCounts={bookedCounts}
    />
  );
}
