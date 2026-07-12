import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminNav from "@/components/admin/AdminNav";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("coach_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/members");

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-28 sm:pt-32">
        <div className="mb-6 flex items-center gap-3">
          <span className="chip border-violet-400/30 bg-violet-400/10 text-violet-200">
            🛡 Admin console
          </span>
        </div>
        <AdminNav />
        <div className="mt-8">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
