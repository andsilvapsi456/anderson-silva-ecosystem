# 17 · WhatsApp real via Evolution API (Oracle Cloud Always Free)

O sistema envia WhatsApp por **dois provedores** (`apps/admin/lib/notifications/whatsapp.ts`):

1. **Evolution API** (preferido) — conecta o **número normal do Anderson** por QR Code,
   como o WhatsApp Web. Sem burocracia da Meta, sem template aprovado, sem custo por mensagem.
2. **Meta Cloud API** (fallback) — só se as vars `WHATSAPP_API_TOKEN`/`WHATSAPP_PHONE_NUMBER_ID`
   estiverem preenchidas e as da Evolution não.
3. Nenhum configurado → modo demo (loga no console).

A Evolution API é um servidor Docker que mantém a sessão do WhatsApp viva — precisa de uma
VM ligada 24h. Plano: **Oracle Cloud Always Free** (grátis para sempre; pede cartão no
cadastro mas não cobra, diferente de free tiers com validade).

O que envia WhatsApp hoje: lembrete 24h com pedido de confirmação, lembrete 2h, cobrança
acolhedora com PIX, aviso de cancelamento/remarcação, parabéns de aniversário 🎂,
recuperação de senha do portal.

---

## Passo 1 — Criar a conta e a VM na Oracle (você faz — precisa de cartão)

1. <https://www.oracle.com/cloud/free/> → **Start for free**. Escolha a região
   **Brazil East (São Paulo)** (não dá para mudar depois). CPF + cartão (não é cobrado;
   verifica ~R$1 e estorna).
2. No console: **Compute → Instances → Create instance**
   - Image: **Ubuntu 24.04**
   - Shape: **Ampere (ARM) — VM.Standard.A1.Flex**, até 4 OCPUs / 24 GB dentro do Always
     Free (2 OCPUs / 12 GB bastam de sobra). Se der "out of capacity", tente outra
     Availability Domain ou o shape Micro (AMD, 1 GB — suficiente).
   - Em **Add SSH keys**, gere/baixe a chave privada (guarde o `.key`).
3. Liberar as portas 80/443: **Networking → Virtual Cloud Networks → (sua VCN) →
   Security Lists → Default → Add Ingress Rules**:
   - Source `0.0.0.0/0`, protocolo TCP, destination port `80`
   - Source `0.0.0.0/0`, protocolo TCP, destination port `443`
4. Anote o **IP público** da instância.

## Passo 2 — DNS no Cloudflare

Zona `andersonsilvapsicologo.com.br` → **DNS → Add record**:

| Tipo | Nome | Conteúdo | Proxy |
|------|------|----------|-------|
| A | `evo` | IP público da VM | **DNS only (nuvem cinza)** |

> DNS only mesmo — o Caddy da VM emite o certificado Let's Encrypt e o desafio HTTP
> precisa chegar direto nele.

## Passo 3 — Subir a Evolution API na VM

```bash
# entrar na VM (o usuário da imagem Ubuntu é "ubuntu")
ssh -i sua-chave.key ubuntu@IP_PUBLICO

# instalar Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu && exit   # sair e entrar de novo p/ valer o grupo

# na sua MÁQUINA: copiar a pasta infra/evolution para a VM
scp -i sua-chave.key -r infra/evolution ubuntu@IP_PUBLICO:~/evolution

# de volta na VM
cd ~/evolution
cp .env.example .env
openssl rand -hex 32   # → cole em EVOLUTION_API_KEY no .env
openssl rand -hex 16   # → cole em POSTGRES_PASSWORD no .env
nano .env              # confira DOMAIN=evo.andersonsilvapsicologo.com.br
docker compose up -d
docker compose logs -f evolution   # esperar "HTTP - ON: 8080"; Ctrl+C p/ sair
```

O firewall interno do Ubuntu da Oracle costuma bloquear 80/443 mesmo com a Security List
aberta. Se `https://evo...` não responder:

```bash
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## Passo 4 — Conectar o WhatsApp (QR Code)

1. Abra `https://evo.andersonsilvapsicologo.com.br/manager` e entre com a
   `EVOLUTION_API_KEY`.
2. **Create instance** → nome `clinica` (sem espaços) → salvar.
3. Clique na instância → **Get QR Code** → no celular: WhatsApp → **Aparelhos
   conectados → Conectar aparelho** → escanear.
4. Status deve ficar **open/connected**. A sessão sobrevive a reinícios (volume
   `evolution_instances`), como um WhatsApp Web que nunca fecha.

## Passo 5 — Apontar o sistema para a Evolution

Cloudflare → Workers → **anderson-silva-ecosystem** (admin) → **Settings →
Variables and Secrets** (runtime; NÃO precisa nas build vars — é só servidor):

| Var | Valor |
|-----|-------|
| `EVOLUTION_API_URL` | `https://evo.andersonsilvapsicologo.com.br` |
| `EVOLUTION_API_KEY` | a mesma do `.env` da VM (tipo **Secret**) |
| `EVOLUTION_INSTANCE` | `clinica` |

Depois **Deploy** (re-deploy para as vars valerem). O portal também envia WhatsApp na
recuperação de senha → repetir as 3 vars no Worker do portal.

## Passo 6 — Testar

```bash
# direto na Evolution (na sua máquina; use SEU número no "number")
curl -X POST "https://evo.andersonsilvapsicologo.com.br/message/sendText/clinica" \
  -H "Content-Type: application/json" -H "apikey: SUA_KEY" \
  -d '{"number":"5511XXXXXXXXX","text":"Teste da clínica ✅"}'
```

No sistema: cancele/remarque uma sessão de teste com paciente que tenha o seu número →
toast "paciente avisado por e-mail + WhatsApp" e a mensagem chega no celular.

---

## Custos e limites

- **Oracle Always Free**: R$ 0 permanente. Risco conhecido: a Oracle pode reciclar VMs
  ARM **ociosas** de contas free — este uso (tráfego diário dos crons) não é ocioso;
  ainda assim, upgrade para "Pay As You Go" (continua sem cobrar pelo Always Free)
  elimina o risco.
- **Evolution/WhatsApp Web**: método não-oficial (mesma base do WhatsApp Web). Uso
  moderado e humanizado como o nosso (lembretes 1-a-1 para pacientes que já conversam
  com a clínica) é o cenário de menor risco de bloqueio. Evitar disparos em massa.
- **Futuro**: ler as RESPOSTAS dos pacientes (ex.: "SIM" confirma a sessão) = configurar
  o webhook da Evolution apontando para `admin/api/webhooks/whatsapp` — backlog.
