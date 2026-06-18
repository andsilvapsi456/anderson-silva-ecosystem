import * as React from "react";

const Check = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="m20 6-11 11-5-5" />
  </svg>
);

/** Painel de marca das telas de login — split-screen limpo e premium. */
export function LoginPanel({
  headline,
  sub,
  quote,
  quoteAuthor,
}: {
  headline: string;
  sub: string;
  quote?: string;
  quoteAuthor?: string;
}) {
  return (
    <aside
      className="relative hidden min-h-screen flex-col justify-between overflow-hidden px-14 py-12 lg:flex lg:w-[44%]"
      style={{ background: "linear-gradient(165deg, #FF6E62 0%, #FF5A5A 42%, #E8453F 100%)" }}
    >
      {/* um único brilho suave — sem textura poluída */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-24 h-[28rem] w-[28rem] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,.22), transparent 68%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-28 h-[30rem] w-[30rem] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(0,0,0,.12), transparent 70%)" }}
      />

      <img src="/brand/logo-white.png" alt="Anderson V. V. Silva — Psicólogo" className="relative w-44" />

      <div className="relative">
        <h2 className="text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-white">{headline}</h2>
        <p className="mt-5 max-w-md text-base leading-relaxed text-white/90">{sub}</p>

        {quote && (
          <figure className="mt-9 max-w-md rounded-2xl bg-white/[0.14] p-6 ring-1 ring-white/25 backdrop-blur-md">
            <div className="mb-2.5 flex items-center gap-2 text-white">
              <span className="text-base tracking-tight" style={{ letterSpacing: "1px" }}>
                ★★★★★
              </span>
              <span className="text-[12px] font-bold text-white/85">5,0 no Google</span>
            </div>
            <blockquote className="text-[15px] leading-relaxed text-white">“{quote}”</blockquote>
            {quoteAuthor && (
              <figcaption className="mt-3 text-[12px] font-semibold text-white/75">— {quoteAuthor}</figcaption>
            )}
          </figure>
        )}
      </div>

      <ul className="relative flex flex-col gap-2.5 text-[13px] font-semibold text-white/90">
        {["Agenda e prontuário integrados", "Financeiro e recibos automáticos", "Portal do paciente incluso"].map(
          (b) => (
            <li key={b} className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white">{Check}</span>
              {b}
            </li>
          )
        )}
      </ul>
    </aside>
  );
}
