import { Button, PageHeader } from "@as/ui";
import { getTransactions } from "../../../../lib/data";
import { TransactionsTable } from "../../../../components/transactions-table";

export default async function ExtratoPage() {
  const rows = [...(await getTransactions())].sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  return (
    <>
      <PageHeader
        title="Extrato"
        subtitle="Todos os lançamentos, em ordem cronológica."
        actions={<Button variant="secondary">Exportar (PDF/Excel)</Button>}
      />
      <TransactionsTable rows={rows} emptyLabel="Nenhum lançamento no período" />
    </>
  );
}
