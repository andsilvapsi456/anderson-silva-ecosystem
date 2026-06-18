import { Button, PageHeader } from "@as/ui";
import { getTransactions } from "../../../../lib/data";
import { TransactionsTable } from "../../../../components/transactions-table";

export default async function DespesasPage() {
  const rows = (await getTransactions()).filter((t) => t.kind === "DESPESA");
  return (
    <>
      <PageHeader title="Despesas" subtitle="Custos fixos e variáveis da clínica." actions={<Button>+ Nova despesa</Button>} />
      <TransactionsTable rows={rows} emptyLabel="Nenhuma despesa no período" />
    </>
  );
}
