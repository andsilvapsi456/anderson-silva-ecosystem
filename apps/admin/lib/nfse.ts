/**
 * NFS-e · OSASCO/SP — emissão automática
 * ───────────────────────────────────────
 * A prefeitura de Osasco (portal EissnfeWebApp) NÃO expõe API pública direta
 * amigável, mas é município integrado dos emissores fiscais. Usamos a
 * Focus NFe (REST), que tem guia oficial para Osasco:
 *   https://focusnfe.com.br/guides/nfse/municipios-integrados/osasco-sp/
 *
 * Requisitos (uma vez só):
 *  1. Gerar o TOKEN de integração no portal da prefeitura
 *     (nfe.osasco.sp.gov.br → acesso do contribuinte → integração);
 *  2. Criar conta na Focus NFe, cadastrar a empresa (CNPJ/CPF + inscrição
 *     municipal) usando esse token como senha do município;
 *  3. Preencher FOCUS_NFE_TOKEN no .env.
 *
 * Fluxo: pagamento confirmado → emitNfse() → nota autorizada → PDF/XML
 * anexados ao paciente e disponíveis no portal. Custo: plano do emissor
 * (não há tier gratuito para produção; homologação é gratuita).
 *
 * Serviço: psicologia → item 4.16 da LC 116/2003 (código municipal
 * conforme cadastro da prefeitura). ISS de Osasco aplicado pela própria
 * prefeitura no processamento.
 */
import { isDemoMode } from "@as/auth";

const FOCUS_API = process.env.FOCUS_NFE_AMBIENTE === "producao"
  ? "https://api.focusnfe.com.br"
  : "https://homologacao.focusnfe.com.br";

export interface NfseInput {
  /** referência única sua (ex.: id da transação) — permite consultar depois */
  ref: string;
  amountCents: number;
  description: string;
  tomador: {
    cpf: string;
    nome: string;
    email?: string | null;
  };
}

export interface NfseResult {
  ok: boolean;
  demo?: boolean;
  status?: string; // processando_autorizacao | autorizado | erro_autorizacao
  numero?: string;
  pdfUrl?: string;
  error?: string;
}

export function isNfseConfigured(): boolean {
  return Boolean(process.env.FOCUS_NFE_TOKEN);
}

export async function emitNfse(input: NfseInput): Promise<NfseResult> {
  if (isDemoMode() || !isNfseConfigured()) {
    console.info(`[DEMO] NFS-e Osasco emitida: ${input.ref} · R$ ${(input.amountCents / 100).toFixed(2)} · ${input.tomador.nome}`);
    return { ok: true, demo: true, status: "autorizado", numero: `DEMO-${input.ref}` };
  }

  const auth = "Basic " + Buffer.from(`${process.env.FOCUS_NFE_TOKEN}:`).toString("base64");

  const res = await fetch(`${FOCUS_API}/v2/nfse?ref=${encodeURIComponent(input.ref)}`, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({
      data_emissao: new Date().toISOString(),
      natureza_operacao: "1", // tributação no município
      prestador: {
        cnpj: process.env.NFSE_PRESTADOR_CNPJ, // ou cpf para autônomo
        inscricao_municipal: process.env.NFSE_INSCRICAO_MUNICIPAL,
        codigo_municipio: "3534401", // IBGE Osasco/SP
      },
      tomador: {
        cpf: input.tomador.cpf.replace(/\D/g, ""),
        razao_social: input.tomador.nome,
        email: input.tomador.email ?? undefined,
      },
      servico: {
        valor_servicos: (input.amountCents / 100).toFixed(2),
        discriminacao: input.description,
        item_lista_servico: "4.16", // psicologia (LC 116/2003)
        codigo_municipio: "3534401",
        iss_retido: false,
      },
    }),
  });

  if (res.status !== 202 && !res.ok) {
    const error = await res.text();
    console.error("Focus NFe falhou:", error);
    return { ok: false, error };
  }

  // A emissão é assíncrona: consultamos o status pela ref
  const check = await fetch(`${FOCUS_API}/v2/nfse/${encodeURIComponent(input.ref)}`, {
    headers: { Authorization: auth },
  });
  const data = await check.json().catch(() => ({}));
  return {
    ok: data.status !== "erro_autorizacao",
    status: data.status ?? "processando_autorizacao",
    numero: data.numero,
    pdfUrl: data.url ?? data.caminho_danfse,
    error: data.status === "erro_autorizacao" ? JSON.stringify(data.erros ?? data) : undefined,
  };
}
