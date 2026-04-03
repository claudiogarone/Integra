TASKS DA COMPLETARE IN ORDINE DI PRIORITÀ

TASK 1: Aggiornamento Navigazione (Sidebar) - ✅ COMPLETATO

La voce "Addestramento AI" è stata aggiunta.

TASK 2: RISOLVERE BUG CRITICO GEMINI EMBEDDING E PINECONE - ✅ COMPLETATO

Implementato sistema di Fallback infallibile su HuggingFace con filtraggio dei vettori nulli. Pinecone riceve correttamente i dati.

TASK 3: Completamento Backend Sicuro e Webhook Stripe - ✅ COMPLETATO

Implementato checkout ibrido (corsi + abbonamenti SaaS) e webhook robusto protetto da HMAC. Gestione automatica del Fallback per lo sviluppo locale in assenza di chiavi Stripe.

TASK 4: Checkup Totale Backend & Completamento Funzioni Mancanti - ⏳ IN CORSO

Contesto: Il "telaio" grafico è solido, ma il backend non è allineato. Ad esempio, il Webhook di Stripe cerca di aggiornare la colonna subscription_status nella tabella profiles, ma questa colonna (insieme ad altre in altre sezioni) non esiste nel database Supabase. Anche alcune funzioni nel CRM e nell'E-commerce usano ancora dati mockati.
Azione per l'AI:

Analisi Strutturale: Fai una scansione completa di tutti i file in app/dashboard/... e app/api/... per capire quali colonne e tabelle Supabase mancano all'appello rispetto alle query che facciamo.

Allineamento Supabase: Genera uno script SQL (che posso eseguire nel pannello SQL Editor di Supabase) per creare tutte le tabelle e le colonne mancanti, incluse le policy RLS per la sicurezza B2B. Assicurati di includere subscription_status in profiles.

Implementazione Modulo per Modulo: Una volta allineato il DB, procedi a rimuovere i dati mockati dal codice frontend e scrivi le chiamate fetch reali verso le API di Next.js per CRM, E-commerce e Marketing.