TASKS DA COMPLETARE IN ORDINE DI PRIORITÀ

TASK 1: Aggiornamento Navigazione (Sidebar)

Azione: Nel file app/dashboard/layout.tsx, localizza l'array menuGroups. Sotto la sezione "Sistema & Formazione", aggiungi questa voce per collegare la pagina di addestramento:
{ name: 'Addestramento AI', href: '/dashboard/ai-training', icon: <BrainCircuit size={18}/>, badge: 'RAG' }

TASK 2: RISOLVERE BUG CRITICO GEMINI EMBEDDING (Errore 404)

Contesto: I file app/api/ai/train/route.ts e app/api/ai/rag-chat/route.ts restituiscono l'errore 404 Not Found quando tentano di chiamare i modelli text-embedding-004 o embedding-001. Questo è un noto blocco regionale (EU) per alcuni account gratuiti di Google AI Studio.
Azione per l'AI:

Analizza i file delle route RAG.

Cerca di correggere la sintassi della richiesta REST (assicurandoti che il body contenga il campo "model" corretto).

Soluzione Alternativa: Se le API di Embedding di Google continuano a dare 404, valuta l'implementazione di un sistema di "Fallback" che utilizzi un modello gratuito open-source alternativo per generare i vettori (es. HuggingFace.js o API gratuite alternative), mantenendo Gemini 1.5 Flash solo per la generazione del testo finale. L'obiettivo è salvare correttamente i vettori su Pinecone.

TASK 3: Completamento Backend Sicuro e Webhook Stripe

Contesto (Dall'analisi del codice): Il file app/api/checkout/route.ts crea la sessione Stripe, ma manca il Webhook per ricevere la conferma di pagamento.
Azione per l'AI:

Crea il file app/api/webhooks/stripe/route.ts.

Implementa l'ascolto dell'evento checkout.session.completed di Stripe.

Al completamento del pagamento, aggiorna il database Supabase: imposta subscription_status = 'active' nella tabella profiles per l'utente che ha pagato, e salva i dettagli della transazione.

TASK 4: Completamento Funzioni Mancanti

Contesto: Pagine come E-commerce, Campagne Marketing e Launchpad hanno UI perfette ma alcune funzioni mancano di logica backend.
Azione per l'AI:
Analizzare i componenti React e, dove trovi funzioni mockate (es. importazioni CSV fittizie, salvataggi senza Supabase), scrivi l'API di Next.js corrispondente e aggiorna la UI per riflettere i veri stati di caricamento.

Tieni presente che il costo totale per modelli Ai di Gemini ed APi e costi a consumo che posso spendere per ogni azienda che si regista alla piattaforma IntegraOS è di 15 euro al mese.