import * as React from "react";

/** Placeholder pulsante para estados de carregamento (perceived performance). */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[var(--radius-sm)] bg-[var(--bg-alt)] ${className}`} />;
}

/** Bloco de página padrão: título + grade de cartões esqueleto. */
export function PageSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div>
      <Skeleton className="mb-2 h-7 w-56" />
      <Skeleton className="mb-7 h-4 w-80" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: cards }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="mt-5 h-64 w-full" />
    </div>
  );
}
