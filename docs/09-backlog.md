# 09 · Backlog Detalhado

Formato: **US-XX** · Como *papel*, quero *ação* para *valor* · Prioridade (P0 crítico → P3 nice-to-have) · Fase

## Épico A — Autenticação e Acesso
| ID | História | Pri | Fase |
|---|---|---|---|
| US-01 | Como paciente, quero entrar com e-mail e senha para acessar meu espaço com segurança | P0 | 1 |
| US-02 | Como equipe, quero MFA para proteger dados clínicos | P1 | 2 |
| US-03 | Como admin, quero convidar pacientes por e-mail para criarem acesso ao portal | P0 | 1 |
| US-04 | Como sistema, devo redirecionar cada papel para sua superfície (paciente→portal, equipe→admin) | P0 | 1 |
| US-05 | Como paciente, quero redefinir minha senha sozinho | P0 | 1 |

## Épico B — Site e Captura de Leads
| ID | História | Pri | Fase |
|---|---|---|---|
| US-06 | Como visitante, quero enviar uma mensagem pelo site e virar lead automaticamente no CRM ✅ | P0 | 0 |
| US-07 | Como visitante, quero o botão "Área do Paciente" no cabeçalho ✅ | P0 | 0 |
| US-08 | Como equipe, quero ver a origem de cada lead (site/WhatsApp/Instagram/Facebook) ✅ | P0 | 0 |
| US-09 | Como admin, quero UTMs registradas no lead para medir campanhas | P2 | 3 |

## Épico C — CRM
| ID | História | Pri | Fase |
|---|---|---|---|
| US-10 | Como equipe, quero kanban com 6 estágios do funil ✅ (visual) | P0 | 1 |
| US-11 | Como equipe, quero arrastar leads entre estágios | P1 | 2 |
| US-12 | Como equipe, quero converter lead em paciente com 1 clique preservando histórico | P0 | 1 |
| US-13 | Como equipe, quero registrar motivo de perda do lead | P2 | 2 |

## Épico D — Agenda
| ID | História | Pri | Fase |
|---|---|---|---|
| US-14 | Como equipe, quero visão semanal estilo Google Calendar ✅ (visual) | P0 | 1 |
| US-15 | Como equipe, quero criar sessões recorrentes (semanal/quinzenal) via RRULE | P0 | 2 |
| US-16 | Como equipe, quero reagendar arrastando o card | P1 | 2 |
| US-17 | Como equipe, quero controlar salas e evitar conflito de ocupação | P1 | 2 |
| US-18 | Como psicólogo, quero sincronizar com meu Google Calendar | P1 | 2 |
| US-19 | Como equipe, quero marcar status (confirmado/pendente/realizado/cancelado/falta) ✅ (modelo) | P0 | 1 |

## Épico E — Portal do Paciente
| ID | História | Pri | Fase |
|---|---|---|---|
| US-20 | Como paciente, quero dashboard com próxima sessão, financeiro e avisos ✅ | P0 | 0 |
| US-21 | Como paciente, quero ver histórico de sessões com status ✅ | P0 | 0 |
| US-22 | Como paciente, quero o botão "Entrar na sessão" liberado só perto do horário ✅ | P0 | 0 |
| US-23 | Como paciente, quero ver cobranças e histórico de pagamentos ✅ | P0 | 0 |
| US-24 | Como paciente, quero baixar recibos e declarações em PDF | P0 | 2 |
| US-25 | Como paciente, quero editar meus contatos ✅ (tela) | P0 | 1 |
| US-26 | Como paciente, quero canal de mensagens seguro com a clínica ✅ (tela) | P0 | 2 |
| US-27 | Como paciente, quero confirmar presença pelo lembrete | P1 | 3 |

## Épico F — Prontuário Eletrônico (LGPD + CFP)
| ID | História | Pri | Fase |
|---|---|---|---|
| US-28 | Como psicólogo, quero registrar anamnese, evolução, plano terapêutico e hipóteses ✅ (modelo+tela) | P0 | 2 |
| US-29 | Como psicólogo, quero templates com campos personalizados | P1 | 2 |
| US-30 | Como sistema, devo versionar toda alteração de prontuário automaticamente ✅ (trigger) | P0 | 0 |
| US-31 | Como admin, quero garantir que secretária/coordenador NUNCA leiam conteúdo clínico ✅ (RLS) | P0 | 0 |
| US-32 | Como psicólogo, quero IA opcional para resumir sessões, com revisão obrigatória | P2 | 3 |
| US-33 | Como psicólogo, quero anexar arquivos ao prontuário | P1 | 2 |

## Épico G — Financeiro
| ID | História | Pri | Fase |
|---|---|---|---|
| US-34 | Como equipe, quero contas a pagar/receber e fluxo de caixa ✅ (telas) | P0 | 2 |
| US-35 | Como equipe, quero KPIs: receita, lucro, inadimplência, ticket médio ✅ | P0 | 2 |
| US-36 | Como equipe, quero emitir recibo numerado em PDF ao confirmar pagamento | P0 | 2 |
| US-37 | Como paciente, quero pagar por PIX direto da cobrança | P1 | 3 💰 |
| US-38 | Como equipe, quero cobrança automática por WhatsApp | P2 | 3 💰 |

## Épico H — Comunicação e Fidelização
| ID | História | Pri | Fase |
|---|---|---|---|
| US-39 | Como sistema, devo enviar lembrete 24h e 2h antes da sessão | P0 | 2 (e-mail) / 3 (WhatsApp) |
| US-40 | Como equipe, quero publicar avisos no portal ✅ (modelo) | P1 | 1 |
| US-41 | Como clínica, quero NPS automático pós-sessão | P2 | 3 |
| US-42 | Como equipe, quero central de tarefas internas | P2 | 3 |

## Épico I — Documentos
| ID | História | Pri | Fase |
|---|---|---|---|
| US-43 | Como equipe, quero gerar contratos/declarações/relatórios/laudos de templates ✅ (tela) | P1 | 2 |
| US-44 | Como psicólogo, quero editor rich-text estilo Word | P1 | 3 |
| US-45 | Como psicólogo, quero assinatura eletrônica com hash verificável | P2 | 3 |
| US-46 | Como paciente, quero aceitar termos LGPD digitalmente com versão registrada ✅ (modelo) | P0 | 1 |

## Épico J — Plataforma
| ID | História | Pri | Fase |
|---|---|---|---|
| US-47 | Como admin, quero trilha de auditoria de toda ação sensível ✅ (modelo+trigger) | P0 | 0 |
| US-48 | Como usuário, quero dark/light mode persistente ✅ | P1 | 0 |
| US-49 | Como admin, quero backups automáticos (Supabase PITR diário) | P0 | 1 |
| US-50 | Como paciente, quero app mobile com push de lembretes | P3 | 4 |
