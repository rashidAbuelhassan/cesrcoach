import { createClient } from "@/lib/supabase/server";
import DiscountManager from "@/components/admin/DiscountManager";
import type { DiscountCodeRow, EventType } from "@/lib/types";

export const metadata = { title: "Discount codes · Admin" };

export default async function AdminDiscountsPage() {
  const supabase = await createClient();

  const [{ data: codes }, { data: eventTypes }] = await Promise.all([
    supabase
      .from("coach_discount_codes")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("coach_event_types").select("*").order("sort_order"),
  ]);

  return (
    <DiscountManager
      codes={(codes as DiscountCodeRow[]) ?? []}
      eventTypes={(eventTypes as EventType[]) ?? []}
    />
  );
}
