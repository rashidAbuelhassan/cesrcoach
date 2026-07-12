import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MemberNav from "@/components/members/MemberNav";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Member area" };

export default async function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/members");

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-28 sm:pt-32">
        <MemberNav />
        <div className="mt-8">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
