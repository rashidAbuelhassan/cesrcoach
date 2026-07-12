import Link from "next/link";
import Logo from "./Logo";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo className="h-12" />
        </div>
        <div className="glass rounded-3xl p-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1.5 text-sm text-mist/60">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 text-center text-xs text-mist/40">
          <Link href="/" className="hover:text-cyan-300">← Back to the homepage</Link>
        </p>
      </div>
    </main>
  );
}
