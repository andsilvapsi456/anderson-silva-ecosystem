import { FinanceNav } from "../../../components/finance-nav";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <FinanceNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
