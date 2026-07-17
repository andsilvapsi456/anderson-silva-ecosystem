/**
 * Skeleton instantâneo do grupo (app): o shell aparece na hora enquanto
 * o servidor busca os dados — o login/navegação deixa de "travar" em branco.
 */
export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Carregando…">
      <div className="mb-7">
        <div className="h-7 w-64 rounded-[var(--radius-xs)] bg-[var(--bg-alt)]" />
        <div className="mt-2 h-4 w-40 rounded-[var(--radius-xs)] bg-[var(--bg-alt)]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-alt)]/60" />
        ))}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        <div className="h-72 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-alt)]/60 lg:col-span-3" />
        <div className="h-72 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-alt)]/60 lg:col-span-2" />
      </div>
    </div>
  );
}
