import { createClient } from "@/lib/supabase/server";
import BookingManager from "@/components/admin/BookingManager";
import type { Booking } from "@/lib/types";

export const metadata = { title: "Bookings · Admin" };

export default async function AdminBookingsPage() {
  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from("coach_bookings")
    .select("*, coach_profiles(*), coach_events(*, coach_event_types(*))")
    .order("created_at", { ascending: false });

  return <BookingManager bookings={(bookings as Booking[]) ?? []} />;
}
