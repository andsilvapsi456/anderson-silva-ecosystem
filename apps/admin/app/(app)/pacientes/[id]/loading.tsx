import { Skeleton } from "@as/ui";

export default function Loading() {
  return (
    <div>
      <Skeleton className="mb-2 h-8 w-64" />
      <Skeleton className="mb-7 h-4 w-48" />
      <div className="grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-72 w-full lg:col-span-1" />
        <Skeleton className="h-72 w-full lg:col-span-2" />
      </div>
      <Skeleton className="mt-5 h-56 w-full" />
    </div>
  );
}
