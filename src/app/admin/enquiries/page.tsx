import { createClient } from "@/lib/supabase/server";
import EnquiryManager from "@/components/admin/EnquiryManager";
import type { Enquiry } from "@/lib/types";

export const metadata = { title: "Enquiries · Admin" };

export default async function AdminEnquiriesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("coach_enquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  return <EnquiryManager enquiries={(data as Enquiry[]) ?? []} />;
}
