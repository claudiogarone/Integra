# SETUP EMAIL INBOUND — Da fare UNA SOLA VOLTA come Admin IntegraOS
# Tempo stimato: ~20 minuti
# Questo abilita la ricezione di email su @mail.integraos.tech per TUTTI i clienti

## STEP 1 — Aggiungi il dominio su Resend
# Vai su: https://resend.com/domains
# → "Add Domain" → inserisci: mail.integraos.tech
# Resend ti darà dei record DNS da aggiungere

## STEP 2 — Configura i record DNS sul tuo provider
# (Cloudflare, GoDaddy, Namecheap, ecc.)
# Aggiungi questi record per il sottodominio mail.integraos.tech:
#
# TIPO  | NOME                        | VALORE
# ------|-----------------------------|-----------------------------------------
# MX    | mail.integraos.tech         | feedback-smtp.eu-west-1.amazonses.com (priorità 10)
# TXT   | mail.integraos.tech         | "v=spf1 include:amazonses.com ~all"
# CNAME | resend._domainkey.mail...   | (fornito da Resend — copia e incolla)

## STEP 3 — Attiva Inbound Routing su Resend
# Vai su: https://resend.com/inbound
# → "Add Inbound Route"
# → Domain: mail.integraos.tech
# → Pattern: * (cattura TUTTE le email, es. inbox-abc123@mail.integraos.tech)
# → Webhook URL: https://app.integraos.tech/api/inbox/webhook/email
# → Salva

## STEP 4 — Verifica che funzioni
# Manda una email di test a: inbox-test@mail.integraos.tech
# Dovresti vedere la richiesta arrivare nei log del server

## FATTO! Da questo momento OGNI cliente può fare il forward
## della propria email aziendale al proprio indirizzo univoco
## inbox-{shortId}@mail.integraos.tech senza che tu debba fare altro.
