import { Button, PageHeader } from "@as/ui";
import { getTransactions } from "../../../../lib/data";
import { TransactionsTable } from "../../../../components/transactions-table";

export default async function ReceitasPage() {
  const rows = (await getTransactions()).filter((t) => t.kind === "RECEITA");
  return (
    <>
      <PageHeader title="Receitas" subtitle="Sessões, pacotes e mensalidades." actions={<Button>+ Nova receita</Button>} />
      <TransactionsTable rows={rows} emptyLabel="Nenhuma receita no período" />
    </>
  );
}
