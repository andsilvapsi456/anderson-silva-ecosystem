/**
 * TEMPLATES OFICIAIS DA MARCA — extraídos dos DOCX da identidade visual
 * (originais em assets/templates/). Os campos {{…}} são preenchidos com
 * os dados do paciente/cobrança na geração; o PDF final usa o papel
 * timbrado com o logotipo principal e a marca d'água da identidade.
 */

export interface DocTemplate {
  id: string;
  kind: string;
  icon: string;
  name: string;
  description: string;
  body: string;
  /** arquivo original da identidade visual */
  sourceDocx: string;
}

const ASSINATURA = `_________________________________________________
Anderson Silva Psicólogo
CRP 06/166223
São Paulo – SP · Fone: (11) 99247-1876`;

export const DOC_TEMPLATES: DocTemplate[] = [
  {
    id: "recibo",
    kind: "RECIBO",
    icon: "🧾",
    name: "Recibo de pagamento",
    description: "Recibo oficial da marca — emitido automaticamente quando o pagamento é confirmado.",
    sourceDocx: "[Anderson V. V. Silva] Recibo.docx",
    body: `RECIBO Nº {{recibo.numero}}

Recebi do(a) Sr.(a) {{paciente.nome}}
CPF: {{paciente.cpf}}

a importância de {{valor.extenso}} ({{valor}})

Referente a {{cobranca.descricao}}.

Para maior clareza firmo o presente.

São Paulo, {{data.extenso}}.

Emitente: Anderson V. V. Silva — Psicólogo
CPF: 440.820.918-07 · CRP 06/166223

Assinatura: ____________________________`,
  },
  {
    id: "contrato",
    kind: "CONTRATO",
    icon: "📝",
    name: "Contrato de Prestação de Serviços – Psicologia",
    description: "Contrato terapêutico oficial: atendimento, sigilo, honorários, desmarcações e faltas.",
    sourceDocx: "[Anderson V. V. Silva] Contrato.docx",
    body: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS – PSICOLOGIA

1º – Atendimento
Cada atendimento clínico terá a duração de 60 minutos em média, sendo realizado em horário combinado, estando o psicólogo à disposição do cliente naquele período. Não será possível estender o horário para além do previsto, mesmo em caso de atraso do cliente.

2º – Sigilo
O psicólogo respeitará o sigilo profissional a fim de proteger, por meio da confiabilidade, a intimidade dos seus clientes, grupos ou organizações, a que tenha acesso no exercício profissional (Código de Ética do Psicólogo, artigo 9º).

3º – Duração da Psicoterapia
A duração do tratamento psicoterápico varia consideravelmente dependendo da pessoa e da natureza das questões a serem trabalhadas.

4º – Dia e Horário
Os dias e horários dos atendimentos serão combinados com o paciente, podendo variar de acordo com as necessidades de adequação da agenda do psicólogo e demanda do paciente.

5º – Honorários
O pagamento será efetuado diretamente ao psicólogo, em espécie ou transferência bancária nas datas combinadas no dia da primeira entrevista.
Qualquer alteração neste contrato ou reajuste somente poderá acontecer com o conhecimento e acordo entre as partes.
O valor das sessões será estabelecido em {{valor_sessao}}. O pagamento será feito por transferência, PIX ou depósito bancário em conta.
• Banco 260 – Nubank, Agência 0001, Conta 2444278-5
• PIX (CPF – 440.820.918-07)
O pagamento poderá ser realizado a cada sessão ou mensalmente conforme combinado entre as partes.

6º – Desmarcações ou mudanças de horário
As desmarcações deverão ser feitas com antecedência de 24 horas. O psicólogo deverá ser avisado no caso de imprevistos que impeçam o comparecimento do paciente.
Mudanças de horário só serão possíveis quando houver disponibilidade do psicólogo. Caso o aviso ocorra com menos de 24 horas, será cobrado o valor integral da sessão.

7º – Faltas
Sessões em que o paciente não comparecer serão cobradas normalmente. A partir de duas faltas consecutivas, sem aviso, durante o tratamento, o atendimento será considerado interrompido e o paciente poderá perder sua vaga preferencial de horário.

8º – Proteção de Dados (LGPD – Lei nº 13.709/2018)
O psicólogo, na condição de controlador dos dados, tratará os dados pessoais e sensíveis (de saúde) do paciente exclusivamente para a finalidade do atendimento psicológico, sua organização (agenda, pagamentos e documentos) e o cumprimento de obrigações legais e do Código de Ética Profissional. Os dados são protegidos por sigilo profissional (art. 9º do Código de Ética) e por medidas de segurança (criptografia e controle de acesso). O prontuário é mantido pelo prazo mínimo de 5 anos (Res. CFP nº 01/2009). O paciente pode, a qualquer momento, solicitar acesso, correção, portabilidade ou eliminação dos seus dados cadastrais, ressalvada a guarda obrigatória do prontuário. Encarregado/contato: hello@andersonsilvapsicologo.com.br.

9º – Teleatendimento (Res. CFP nº 09/2024)
O paciente concorda com a realização de sessões on-line por videochamada, ciente das condições técnicas necessárias e de que o mesmo sigilo do atendimento presencial é assegurado.

Ao assinar este contrato, o paciente declara que LEU E CONCORDA com todas as cláusulas acima, INCLUSIVE com o tratamento de seus dados (LGPD) e com o teleatendimento.

Anderson Silva Psicólogo — CRP 06/166223

Paciente: {{paciente.nome}}
CPF: {{paciente.cpf}}

São Paulo – SP, {{data.extenso}}
Fone: (11) 99247-1876`,
  },
  {
    id: "anamnese",
    kind: "ANAMNESE",
    icon: "📋",
    name: "Ficha de Anamnese",
    description: "Roteiro completo oficial: panorama clínico, histórico da queixa, relacionamentos, infância, adolescência e vida adulta.",
    sourceDocx: "[Anderson V. V. Silva] Ficha Anamnese.docx",
    body: `FICHA ANAMNESE — {{paciente.nome}}

IDENTIFICAÇÃO
Nome: {{paciente.nome}} · Idade: {{paciente.idade}}
Endereço: {{paciente.endereco}}
Telefones para contato: {{paciente.telefone}}
Escolaridade: ____ · Est. Civil: ____ · Profissão: ____
Cônjuge (nome, idade, profissão): ____
Filhos (nome, idade, escolaridade): ____
Pratica alguma religião? Se sim, qual? ____
Fez terapia anteriormente? (citar qual e quando) ____
Quais são as suas expectativas e objetivos com a psicoterapia? ____
Atualmente, tem apresentado comportamentos, ideias, emoções que considera um sintoma? Se sim, quais? ____

PARTE I – PANORAMA CLÍNICO
Tem alguma doença preexistente/crônica? ____
Já teve algum transtorno psicológico/psiquiátrico diagnosticado anteriormente? ____
Há histórico de transtornos psicológicos/psiquiátricos na família? ____
Doenças importantes que teve: ____
Acidentes e/ou outros traumas importantes: ____
Faz uso de medicação? Qual(is)? ____
Medicação alternativa (chás, compostos etc.)? ____
Faz/já fez acompanhamento médico/terapêutico/holístico? Qual? ____

PARTE II – HISTÓRICO DA QUEIXA
Quando se iniciou: ____
Eventos traumáticos de vida: ____
Possíveis eventos/fatores que precipitam ou agravam crises: ____
Fuma (frequência)? ____ · Utiliza álcool (frequência)? ____
Uso de outras substâncias psicoativas (frequência)? ____
Tentativa de suicídio? Sim ( ) Não ( )
Objetivos de intervenção na psicoterapia: ____

PARTE III – RELACIONAMENTOS IMPORTANTES (qualidade do vínculo)
Mãe: ____ · Pai: ____ · Irmãos: ____
Cônjuge: ____ · Filho(s): ____ · Outros importantes: ____
Observações sobre dinâmica familiar atual: ____

PARTE IV – INFÂNCIA
Gravidez (planejada ou não), parto, intercorrências: ____
Amamentação: ____ · Treinamento de higiene: ____
Estressores na infância, crises: ____
Outros transtornos infantis (sono, alimentação, psicomotor, gagueira, tiques, sonambulismo, aprendizagem): ____
Outros comentários: ____

PARTE V – ADOLESCÊNCIA
Experiências afetivas marcantes: ____
Experiências sexuais marcantes: ____
Independência / primeiros empregos: ____
Círculo de amizades: ____

PARTE VI – VIDA ADULTA
Relacionamento com parceiro, se houver: ____
Vida sexual atual: ____
Possui casa própria? ____ · Possui carro? Dirige? ____
Atualmente está empregado? ____
Situação financeira atual: ____`,
  },
  {
    id: "receituario",
    kind: "DECLARACAO",
    icon: "📄",
    name: "Receituário / Declaração",
    description: "Papel timbrado para declarações de comparecimento e encaminhamentos, com assinatura oficial.",
    sourceDocx: "[Anderson V. V. Silva] Receituário.docx",
    body: `{{titulo}}

{{corpo}}

${ASSINATURA}`,
  },
  {
    id: "timbrado",
    kind: "RELATORIO",
    icon: "📜",
    name: "Papel timbrado (relatórios e laudos)",
    description: "Base oficial para relatórios psicológicos e laudos (Resolução CFP nº 06/2019) — exige revisão profissional.",
    sourceDocx: "[Anderson V. V. Silva] Papel Timbrado.docx",
    body: `{{titulo}}

{{corpo}}

${ASSINATURA}`,
  },
];
