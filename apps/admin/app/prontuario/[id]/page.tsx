/**
 * PRONTUÁRIO PSICOLÓGICO — documento formal no padrão da
 * Resolução CFP nº 001/2009 (registro documental), com as seções:
 *  I.   Identificação do usuário
 *  II.  Avaliação de demanda e definição de objetivos
 *  III. Registro da evolução (datas e procedimentos)
 *  IV.  Encerramento / encaminhamento
 *  V.   Documentos produzidos
 * Fora do shell do app → página limpa para imprimir/salvar em PDF.
 * Guarda mínima: 5 anos (art. 15). Sigilo: art. 9º do Código de Ética.
 */
import { notFound } from "next/navigation";
import { formatBRL, formatDate } from "@as/shared";
import { getPatient, getPatientPanel, getRecordEntries, getTransactions } from "../../../lib/data";
import { PrintButton } from "../../../components/print-button";

const kindLabel: Record<string, string> = {
  ANAMNESE: "Anamnese",
  EVOLUCAO: "Evolução",
  PLANO_TERAPEUTICO: "Plano terapêutico",
  HIPOTESE_DIAGNOSTICA: "Hipótese diagnóstica",
  ENCAMINHAMENTO: "Encaminhamento",
  OBSERVACAO: "Observação",
};

export const metadata = { robots: { index: false } };

export default async function ProntuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // uma rodada só — getPatient junto (as demais só dependem do id)
  const [patient, entries, panel, transactions] = await Promise.all([
    getPatient(id),
    getRecordEntries(id),
    getPatientPanel(id),
    getTransactions(),
  ]);
  if (!patient) notFound();
  const ordered = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const demanda = ordered.filter((e) => e.kind === "ANAMNESE" || e.kind === "PLANO_TERAPEUTICO");
  const evolucao = ordered.filter((e) => e.kind === "EVOLUCAO" || e.kind === "OBSERVACAO" || e.kind === "HIPOTESE_DIAGNOSTICA");
  const encerramento = ordered.filter((e) => e.kind === "ENCAMINHAMENTO");
  const receipts = transactions.filter((t) => t.patientId === id && t.receiptNumber);

  const section = "mt-8 break-inside-avoid";
  const h2 = "border-b-2 border-[#202020] pb-1 text-[15px] font-extrabold uppercase tracking-wide";
  const lbl = "font-bold";

  return (
    <main className="mx-auto max-w-3xl bg-white px-10 py-10 text-[13px] leading-relaxed text-[#202020] print:px-0 print:py-0">
      {/* barra de ações — some na impressão */}
      <div className="mb-8 flex items-center justify-between gap-3 rounded-xl bg-[#f8f9fa] px-5 py-3 print:hidden">
        <p className="text-xs text-[#6a7178]">
          Documento conforme <strong>Resolução CFP nº 001/2009</strong> · guarda mínima de 5 anos · sigilo
          profissional (art. 9º)
        </p>
        <PrintButton />
      </div>

      {/* papel timbrado */}
      <header className="flex items-center justify-between border-b-4 border-[#FF5A5A] pb-4">
        <img src="/brand/logo.png" alt="Anderson V. V. Silva — Psicólogo" className="h-20 w-auto" />
        <div className="text-right text-[11px] leading-snug text-[#6a7178]">
          <p className="text-[13px] font-extrabold text-[#202020]">PRONTUÁRIO PSICOLÓGICO</p>
          <p>Anderson Victor Vieira Silva · CRP 06/166223</p>
          <p>hello@andersonsilvapsicologo.com.br · (11) 99247-1876</p>
          <p>Emitido em {new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
        </div>
      </header>

      {/* I. Identificação */}
      <section className={section}>
        <h2 className={h2}>I. Identificação do usuário</h2>
        <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1.5">
          <p><span className={lbl}>Nome:</span> {patient.name}</p>
          <p><span className={lbl}>Nascimento:</span> {patient.birthDate ? formatDate(patient.birthDate) : "—"}</p>
          <p><span className={lbl}>CPF:</span> {patient.cpf ?? "—"}</p>
          <p><span className={lbl}>Telefone:</span> {patient.whatsapp ?? patient.phone ?? "—"}</p>
          <p><span className={lbl}>E-mail:</span> {patient.email ?? "—"}</p>
          <p><span className={lbl}>Endereço:</span> {patient.address ?? "—"}</p>
          <p><span className={lbl}>Início do acompanhamento:</span> {formatDate(panel.startDate)}</p>
          <p><span className={lbl}>Modalidade:</span> Psicoterapia individual on-line</p>
        </div>
      </section>

      {/* II. Demanda e objetivos */}
      <section className={section}>
        <h2 className={h2}>II. Avaliação de demanda e definição de objetivos</h2>
        {demanda.length === 0 ? (
          <p className="mt-3 italic text-[#6a7178]">Sem registros nesta seção.</p>
        ) : (
          demanda.map((e) => (
            <div key={e.id} className="mt-3">
              <p className="font-bold">
                {kindLabel[e.kind]} — {formatDate(e.createdAt)} · {e.authorName}
              </p>
              <p className="mt-0.5 whitespace-pre-line">{e.content}</p>
            </div>
          ))
        )}
      </section>

      {/* III. Evolução */}
      <section className={section}>
        <h2 className={h2}>III. Registro da evolução do serviço</h2>
        {evolucao.length === 0 ? (
          <p className="mt-3 italic text-[#6a7178]">Sem registros nesta seção.</p>
        ) : (
          evolucao.map((e) => (
            <div key={e.id} className="mt-3 break-inside-avoid">
              <p className="font-bold">
                {formatDate(e.createdAt)} — {e.title} · {e.authorName}
              </p>
              <p className="mt-0.5 whitespace-pre-line">{e.content}</p>
            </div>
          ))
        )}
      </section>

      {/* IV. Encerramento */}
      <section className={section}>
        <h2 className={h2}>IV. Registro de encerramento ou encaminhamento</h2>
        {encerramento.length === 0 ? (
          <p className="mt-3 italic">Acompanhamento em andamento na data de emissão deste documento.</p>
        ) : (
          encerramento.map((e) => (
            <div key={e.id} className="mt-3">
              <p className="font-bold">{formatDate(e.createdAt)} — {e.title}</p>
              <p className="mt-0.5 whitespace-pre-line">{e.content}</p>
            </div>
          ))
        )}
      </section>

      {/* V. Documentos */}
      <section className={section}>
        <h2 className={h2}>V. Documentos produzidos na prestação do serviço</h2>
        <ul className="mt-3 list-disc pl-5">
          <li>Contrato de Prestação de Serviços – Psicologia (assinado)</li>
          <li>Termo de consentimento — tratamento de dados (LGPD) e teleatendimento</li>
          {receipts.map((t) => (
            <li key={t.id}>
              Recibo {t.receiptNumber} — {t.description} ({formatBRL(t.amountCents)})
            </li>
          ))}
        </ul>
      </section>

      {/* assinatura */}
      <footer className="mt-14 break-inside-avoid text-center">
        <p className="mx-auto w-72 border-t border-[#202020] pt-2 font-bold">Anderson Victor Vieira Silva</p>
        <p className="text-[11px]">Psicólogo · CRP 06/166223</p>
        <p className="mt-6 text-[10px] text-[#6a7178]">
          Documento sigiloso, protegido pelo art. 9º do Código de Ética Profissional do Psicólogo e pela Lei nº
          13.709/2018 (LGPD). Registro mantido por no mínimo 5 (cinco) anos — Res. CFP nº 001/2009, art. 15.
        </p>
      </footer>
    </main>
  );
}
