import * as React from "react";

export function EmptyState({
  icon = "✨",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <span className="text-3xl" aria-hidden>
        {icon}
      </span>
      <p className="font-bold">{title}</p>
      {description && <p className="text-sm text-[var(--text-soft)] max-w-sm">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
