import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/documents/:id/stream
 *
 * Streams a member document's bytes through the app instead of handing the
 * browser a signed storage URL. The file location is never exposed, the
 * response is not cacheable, and every request re-checks the session — so a
 * copied link is useless to anyone who isn't signed in.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // RLS limits this to published documents (or anything, for admins).
  const { data: doc } = await supabase
    .from("coach_documents")
    .select("id, title, file_path")
    .eq("id", id)
    .single();

  if (!doc?.file_path) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const { data: file, error } = await supabase.storage
    .from("coach-documents")
    .download(doc.file_path);

  if (error || !file) {
    return NextResponse.json(
      { error: "Could not load this document." },
      { status: 502 }
    );
  }

  const isPdf =
    doc.file_path.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";

  return new NextResponse(file.stream(), {
    headers: {
      "Content-Type": isPdf ? "application/pdf" : "application/octet-stream",
      "Content-Disposition": "inline",
      "Content-Length": String(file.size),
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "X-Content-Type-Options": "nosniff",
      // don't let the bytes be framed by another origin
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
