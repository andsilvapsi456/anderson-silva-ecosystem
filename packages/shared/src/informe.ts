/**
 * Informe anual de pagamentos para o Imposto de Renda.
 * O paciente usa para deduzir despesas com psicoterapia (despesas médicas).
 * Texto puro (sem dependências) → vira PDF via @as/shared/pdf nos apps.
 */
import { BRAND } from "./brand";
import { formatBRL } from "./format";
import { valorPorExtenso } from "./extenso";

export interface AnnualStatementPayment {
  date: string; // ISO
  amountCents: number;
  description?: string;
}

export interface AnnualStatementInput {
  year: number;
  patientName: string;
  patientCpf: string;
  payments: AnnualStatementPayment[];
}

export interface AnnualStatement {
  title: string;
  body: string;
  totalCents: number;
  count: number;
}

function brDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

/** Valor sem o "R$" (a string já vem com espaço comum OU não-quebrável). */
function reais(cents: number): string {
  return formatBRL(cents).replace(/^R\$\s*/, "");
}

export function composeAnnualStatement(a: AnnualStatementInput): AnnualStatement {
  const sorted = [...a.payments].sort((x, y) => x.date.localeCompare(y.date));
  const totalCents = sorted.reduce((s, p) => s + p.amountCents, 0);
  const count = sorted.length;

  const linhas = sorted
    .map((p) => `   ${brDate(p.date).padEnd(12)}  R$ ${reais(p.amountCents).padStart(10)}   ${p.description ?? "Sessão de psicoterapia"}`)
    .join("\n");

  const hoje = new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

  const body =
    `INFORME DE PAGAMENTOS PARA FINS DE IMPOSTO DE RENDA\n` +
    `Ano-calendário ${a.year}\n` +
    `\n` +
    `PROFISSIONAL\n` +
    `${BRAND.fullName} — ${BRAND.title}\n` +
    `${BRAND.crp}  ·  CPF ${BRAND.cpf}\n` +
    `\n` +
    `PACIENTE\n` +
    `${a.patientName}\n` +
    `CPF: ${a.patientCpf}\n` +
    `\n` +
    `Declaro, para fins de comprovação junto à Receita Federal do Brasil (dedução\n` +
    `de despesas médicas — psicoterapia), que recebi do(a) paciente acima\n` +
    `identificado(a) a importância total de R$ ${reais(totalCents)}\n` +
    `(${valorPorExtenso(totalCents)}), referente a ${count} ${count === 1 ? "sessão" : "sessões"} de\n` +
    `psicoterapia realizada${count === 1 ? "" : "s"} no ano-calendário de ${a.year}, conforme\n` +
    `discriminado abaixo:\n` +
    `\n` +
    `   DATA          VALOR        DESCRIÇÃO\n` +
    `${linhas}\n` +
    `\n` +
    `   TOTAL RECEBIDO NO ANO: R$ ${reais(totalCents)}\n` +
    `\n` +
    `Modalidade: atendimento psicológico (psicoterapia).\n` +
    `Forma de pagamento: PIX.\n` +
    `\n` +
    `Este informe destina-se exclusivamente à comprovação de despesas para a\n` +
    `Declaração de Ajuste Anual do Imposto de Renda Pessoa Física.\n` +
    `\n` +
    `${BRAND.city}, ${hoje}.\n` +
    `\n` +
    `\n` +
    `_______________________________________________\n` +
    `${BRAND.fullName}\n` +
    `${BRAND.title} · ${BRAND.crp}`;

  return { title: `Informe IR ${a.year}`, body, totalCents, count };
}
