import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SecureDocumentViewer from "@/components/members/SecureDocumentViewer";

export const metadata = {
  title: "Document reader",
  robots: { index: false, follow: false },
};

/**
 * Standalone, chrome-free reader window for member documents.
 * Deliberately outside the /members layout so it opens as its own window.
 */
export default async function ReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/reader/${id}`);

  const [{ data: doc }, { data: profile }] = await Promise.all([
    supabase
      .from("coach_documents")
      .select("id, title, description, category, file_path, external_url")
      .eq("id", id)
      .single(),
    supabase.from("coach_profiles").select("full_name").eq("id", user.id).single(),
  ]);

  if (!doc || !doc.file_path) notFound();

  return (
    <SecureDocumentViewer
      documentId={doc.id}
      title={doc.title}
      category={doc.category}
      viewerLabel={profile?.full_name || user.email || "CESR Coach member"}
      viewerEmail={user.email ?? ""}
    />
  );
}
