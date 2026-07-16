import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import BookingBoard from "@/components/members/BookingBoard";
import type { Booking, CoachEvent, EventType } from "@/lib/types";

export const metadata = { title: "Bookings" };

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: eventTypes },
    { data: events },
    { data: myBookings },
    { data: counts },
  ] = await Promise.all([
    supabase
      .from("coach_event_types")
      .select("*")
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("coach_events")
      .select("*, coach_event_types(*)")
      .eq("status", "scheduled")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at"),
    supabase
      .from("coach_bookings")
      .select("*, coach_events(*, coach_event_types(*))")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase.rpc("coach_event_booked_counts"),
  ]);

  const bookedCounts: Record<string, number> = {};
  for (const row of (counts as { event_id: string; booked: number }[]) ?? []) {
    bookedCounts[row.event_id] = Number(row.booked);
  }

  return (
    <Suspense>
      <BookingBoard
        eventTypes={(eventTypes as EventType[]) ?? []}
        events={(events as CoachEvent[]) ?? []}
        myBookings={(myBookings as Booking[]) ?? []}
        bookedCounts={bookedCounts}
      />
    </Suspense>
  );
}
