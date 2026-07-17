/**
 * Skeleton instantâneo da Área do Paciente: feedback imediato na navegação
 * enquanto o servidor busca os dados.
 */
export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Carregando…">
      <div className="mb-7">
        <div className="h-7 w-56 rounded-[var(--radius-xs)] bg-[var(--bg-alt)]" />
        <div className="mt-2 h-4 w-36 rounded-[var(--radius-xs)] bg-[var(--bg-alt)]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-alt)]/60" />
        ))}
      </div>
      <div className="mt-6 h-64 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-alt)]/60" />
    </div>
  );
}
