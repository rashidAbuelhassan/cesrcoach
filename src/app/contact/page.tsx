import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { getBranding } from "@/lib/settings";

export const metadata = {
  title: "Talk to us first",
  description:
    "Ask a question about the CESR / Portfolio Pathway route or our sessions before you book.",
};

const topics = [
  "Which session suits me?",
  "Am I eligible for CESR?",
  "Group places and pricing",
];

export default async function ContactPage() {
  const branding = await getBranding();

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-32 pb-8 sm:pt-40">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
          <div className="lg:sticky lg:top-32">
            <span className="chip">Before you book</span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Talk to us <span className="text-aurora">first</span>
            </h1>
            <p className="mt-4 max-w-md text-mist/90">
              Send your details and your question. A consultant on our team
              replies by email.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {topics.map((t) => (
                <li key={t} className="chip">
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <ContactForm contactEmail={branding.contactEmail} />
        </div>
      </main>
      <Footer siteName={branding.siteName} contactEmail={branding.contactEmail} />
    </div>
  );
}
