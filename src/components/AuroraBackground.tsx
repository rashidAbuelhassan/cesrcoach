/**
 * Animated "liquid" background: drifting aurora blobs behind a glass grain,
 * fixed behind all content. Pure CSS — no runtime cost beyond compositing.
 */
export default function AuroraBackground() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
      {/* base depth gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,#0b1735_0%,#060a18_48%,#04060e_100%)]" />

      {/* drifting aurora blobs */}
      <div className="absolute -top-[20%] -left-[10%] h-[60vh] w-[60vh] rounded-full bg-cyan-500/25 blur-[120px] animate-float-slow" />
      <div className="absolute top-[10%] right-[-15%] h-[70vh] w-[70vh] rounded-full bg-violet-500/20 blur-[140px] animate-float-slower" />
      <div className="absolute bottom-[-25%] left-[20%] h-[65vh] w-[65vh] rounded-full bg-emerald-500/15 blur-[130px] animate-float-slow" />
      <div className="absolute top-[45%] left-[45%] h-[40vh] w-[40vh] rounded-full bg-sky-400/15 blur-[100px] animate-float-slower" />

      {/* fine dot lattice for texture */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 20%, black 0%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 20%, black 0%, transparent 100%)",
        }}
      />

      {/* film grain to sell the glass */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
