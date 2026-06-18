import { Badge, Button, Card, CardContent, CardHeader, CardTitle, PageHeader } from "@as/ui";
import { DOC_TEMPLATES } from "../../../lib/document-templates";

/**
 * Gerador de documentos — usa os TEMPLATES OFICIAIS da identidade visual
 * (originais .docx em assets/templates/). Os campos {{…}} são preenchidos
 * com os dados do paciente; Fase 3: editor rich-text (Tiptap) + PDF no
 * papel timbrado + assinatura digital via Autentique.
 */
export default function DocumentosPage() {
  return (
    <>
      <PageHeader
        title="Documentos"
        subtitle="Templates oficiais da sua identidade visual — recibo, contrato, anamnese, declarações e laudos."
        actions={<Button>+ Novo template</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {DOC_TEMPLATES.map((t) => (
          <Card key={t.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>
                <span aria-hidden className="mr-2">
                  {t.icon}
                </span>
                {t.name}
              </CardTitle>
              <Badge tone="accent">Oficial da marca</Badge>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <p className="text-sm text-[var(--text-soft)]">{t.description}</p>
              <details className="mt-3 flex-1">
                <summary className="cursor-pointer text-xs font-bold text-[var(--accent)]">
                  Ver conteúdo do template
                </summary>
                <pre className="mt-2 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-[var(--radius-sm)] bg-[var(--bg-alt)] px-4 py-3 font-sans text-xs leading-relaxed">
                  {t.body}
                </pre>
              </details>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button size="sm">Gerar documento</Button>
                <Button size="sm" variant="ghost">
                  Editar template
                </Button>
                <span className="ml-auto text-[10px] text-[var(--text-soft)]" title={t.sourceDocx}>
                  📎 {t.sourceDocx}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle>🔒 Termo de consentimento LGPD</CardTitle>
            <Badge tone="info">Sistema</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--text-soft)]">
              Termo versionado com registro de aceite (data, IP e versão) — enviado para assinatura digital via
              Autentique quando conectado em Configurações.
            </p>
            <div className="mt-4 flex gap-2">
              <Button size="sm">Gerar documento</Button>
              <Button size="sm" variant="ghost">
                Editar template
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <p className="mt-6 text-xs text-[var(--text-soft)]">
        Documentos gerados ficam vinculados ao paciente e disponíveis no Portal quando aplicável. O recibo oficial é
        emitido automaticamente na confirmação do pagamento, com numeração sequencial (REC-AAAA-NNNN).
      </p>
    </>
  );
}
