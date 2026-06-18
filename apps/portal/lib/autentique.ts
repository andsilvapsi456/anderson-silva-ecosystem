/**
 * AUTENTIQUE — assinatura digital válida (autentique.com.br).
 * API GraphQL v2 com upload multipart. Sem AUTENTIQUE_TOKEN → modo demo.
 *
 * Fluxo do contrato automático:
 *  paciente termina o cadastro pelo link → contrato oficial preenchido
 *  com os dados → PDF gerado → documento criado no Autentique →
 *  o paciente recebe o e-mail do Autentique para assinar.
 * O webhook /api/webhooks/autentique (admin) marca a assinatura no sistema.
 */

const API = "https://api.autentique.com.br/v2/graphql";

export interface SignatureResult {
  ok: boolean;
  demo?: boolean;
  documentId?: string;
  signLink?: string;
  error?: string;
}

export function isAutentiqueConfigured(): boolean {
  return Boolean(process.env.AUTENTIQUE_TOKEN);
}

export async function sendForSignature(args: {
  fileName: string;
  pdf: Buffer;
  signerName: string;
  signerEmail: string;
}): Promise<SignatureResult> {
  if (!isAutentiqueConfigured()) {
    console.info(
      `[DEMO] Autentique: documento "${args.fileName}" (${(args.pdf.length / 1024).toFixed(1)}KB) ` +
        `enviado para assinatura de ${args.signerName} <${args.signerEmail}>`
    );
    return { ok: true, demo: true, documentId: "demo-doc", signLink: "https://app.autentique.com.br/demo" };
  }

  const operations = JSON.stringify({
    query: `mutation CreateDocument($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
      createDocument(document: $document, signers: $signers, file: $file) {
        id name signatures { public_id link { short_link } }
      }
    }`,
    variables: {
      document: { name: args.fileName },
      signers: [{ email: args.signerEmail, action: "SIGN", name: args.signerName }],
      file: null,
    },
  });

  const form = new FormData();
  form.append("operations", operations);
  form.append("map", JSON.stringify({ file: ["variables.file"] }));
  form.append("file", new Blob([new Uint8Array(args.pdf)], { type: "application/pdf" }), args.fileName);

  const res = await fetch(API, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.AUTENTIQUE_TOKEN}` },
    body: form,
  });

  const json = await res.json().catch(() => null);
  const doc = json?.data?.createDocument;
  if (!res.ok || !doc) {
    console.error("Autentique falhou:", JSON.stringify(json?.errors ?? json));
    return { ok: false, error: "Falha ao enviar para assinatura." };
  }
  return {
    ok: true,
    documentId: doc.id,
    signLink: doc.signatures?.[0]?.link?.short_link,
  };
}
