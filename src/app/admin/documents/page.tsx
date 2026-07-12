import { createClient } from "@/lib/supabase/server";
import DocumentManager from "@/components/admin/DocumentManager";
import type { Doc } from "@/lib/types";

export const metadata = { title: "Documents · Admin" };

export default async function AdminDocumentsPage() {
  const supabase = await createClient();
  const { data: docs } = await supabase
    .from("coach_documents")
    .select("*")
    .order("sort_order")
    .order("created_at", { ascending: false });

  return <DocumentManager docs={(docs as Doc[]) ?? []} />;
}
