import { createClient } from "@/lib/supabase/server";
import DocumentList from "@/components/members/DocumentList";
import type { Doc } from "@/lib/types";

export const metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data: docs } = await supabase
    .from("coach_documents")
    .select("*")
    .eq("published", true)
    .order("sort_order")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 pb-8">
      <header>
        <h1 className="text-3xl font-bold">📄 Document library</h1>
        <p className="mt-2 text-mist/60">
          Templates, checklists and guides. Documents open in our secure
          reader — they&apos;re for your personal study and can&apos;t be
          downloaded or printed.
        </p>
      </header>
      <DocumentList docs={(docs as Doc[]) ?? []} />
    </div>
  );
}
