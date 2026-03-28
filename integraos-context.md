CONTESTO DEL PROGETTO: INTEGRAOS (SaaS Enterprise B2B)

1. Identità e Brand

Nome Piattaforma: IntegraOS

Colori Principali: Deep Teal (#00665E) per il brand primario. Moduli secondari usano Smeraldo (CRM), Viola (AI/Design), Blu (Ecommerce), Ambra (Formazione).

UI/UX: Il front-end è GIÀ PERFETTO. Usa bordi arrotondati (rounded-3xl, rounded-2xl), ombre morbide (shadow-lg), sfondi chiari (bg-[#F8FAFC]) e glassmorphism. NON STRAVOLGERE MAI IL DESIGN ESISTENTE.

2. Tecnologie e Architettura

Frontend: Next.js 14+ (App Router), React, Tailwind CSS, Lucide Icons, Recharts.

Backend & Database: Supabase (PostgreSQL, Auth, Storage).

Intelligenza Artificiale: Google Gemini API (gemini-1.5-flash).

Vector DB (RAG): Pinecone (Namespace isolati per user_id).

Servizi Esterni: Chatwoot (Omnicanalità), Resend (Email), Stripe (Pagamenti).

3. REGOLE INVIOLABILI (MULTI-TENANT SAAS)

Essendo un software B2B, gestiamo dati di migliaia di aziende diverse:

Isolamento dei Dati (RLS): OGNI query al database (Select, Insert, Update, Delete) DEVE filtrare rigorosamente per l'id dell'azienda (user_id). Nessuna azienda deve mai poter leggere i dati di un'altra.

Stop alla Service Key: Attualmente molte API in /app/api/... usano la SUPABASE_SERVICE_ROLE_KEY. Sostituiscila dove possibile con il client autenticato standard per rispettare le policy RLS di Supabase. Usa la Service Key SOLO nei Webhook (es. Stripe, Resend).

Gestione Errori Antiproiettile: Tutte le API (route.ts) devono avere blocchi try/catch. Se un servizio esterno fallisce, restituisci un errore JSON pulito con status 500, in modo che il frontend possa mostrare un alert amichevole senza crashare.