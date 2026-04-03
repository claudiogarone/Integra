import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getMonthName(monthIndex: number) {
  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  return months[monthIndex];
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split('Bearer ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token non fornito dal client.' }, { status: 401 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch { }
          },
        },
      }
    )
    
    // Auth Check: Validiamo ESPLICITAMENTE il token JWT inviato dal client invece di affidarci ai cookie
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.log("Auth error Data Studio:", authError);
      return NextResponse.json({ error: 'Non autorizzato o token scaduto. Ricarica la pagina.' }, { status: 401 });
    }

    const body = await req.json();
    const query = (body.query || '').toLowerCase();

    // -- 1. DOMANDA SUL FATTURATO / VENDITE
    if (query.includes('fatturato') || query.includes('vendit') || query.includes('entrat') || query.includes('ricav') || query.includes('mese') || query.includes('mesi')) {
      // Dato che usiamo RLS, Supabase deve usare il token nella chiamata .select(). 
      // Supabase-js invia il token di sessione (o global headers se configurati).
      // Per assicurarci che RLS funzioni, possiamo sovrascrivere l'header Authorization della riga globale del client
      const supabaseWithAuth = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: { getAll() { return cookieStore.getAll() }, setAll() {} },
          global: {
            headers: { Authorization: `Bearer ${token}` }
          }
        }
      );

      const { data: orders, error } = await supabaseWithAuth.from('orders').select('amount, created_at, status');
      
      if (error) throw error;
      
      if (!orders || orders.length === 0) {
         return NextResponse.json({
            text: "Non ho trovato ordini nel database per elaborare le statistiche sul fatturato.",
            type: 'text'
         });
      }

      // Aggregazione per mese
      const monthlyData: Record<string, number> = {};
      
      orders.forEach(order => {
        if (order.status !== 'cancelled' && order.status !== 'refunded') {
            const date = new Date(order.created_at);
            const key = `${date.getFullYear()}_${date.getMonth()}`;
            if (!monthlyData[key]) monthlyData[key] = 0;
            monthlyData[key] += order.amount || 0;
        }
      });

      const sortedKeys = Object.keys(monthlyData).sort();
      let hasData = false;
      const chartData = sortedKeys.map(key => {
        const val = parseFloat(monthlyData[key].toFixed(2));
        if (val > 0) hasData = true;
        const [year, monthIdx] = key.split('_');
        return {
           name: `${getMonthName(parseInt(monthIdx))} '${year.substring(2)}`,
           Fatturato: val
        };
      });

      return NextResponse.json({
         text: hasData ? "Ho aggregato i dati reali dei tuoi ordini. Ecco l'andamento del fatturato nel tempo." : "Tutti gli ordini nel periodo sono annullati o a zero.",
         type: 'chart',
         chartType: 'area', 
         data: chartData,
         dataKey1: 'Fatturato' 
      });
    }

    // -- 2. DOMANDA SUI LEAD / CONTATTI / SORGENTI
    if (query.includes('lead') || query.includes('contatt') || query.includes('sorgent') || query.includes('clienti')) {
      const supabaseWithAuth = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
          cookies: { getAll() { return cookieStore.getAll() }, setAll() {} },
          global: { headers: { Authorization: `Bearer ${token}` } }
      });
      const { data: contacts, error } = await supabaseWithAuth.from('contacts').select('source, status');
      
      if (error) throw error;
      if (!contacts || contacts.length === 0) {
         return NextResponse.json({
            text: "Non ci sono contatti nel tuo CRM al momento.",
            type: 'text'
         });
      }

      const sourceCount: Record<string, number> = {};
      contacts.forEach(c => {
         const s = c.source && c.source.trim() !== '' ? c.source : 'Sconosciuta';
         if (!sourceCount[s]) sourceCount[s] = 0;
         sourceCount[s]++;
      });

      const chartData = Object.keys(sourceCount).map(k => ({
         name: k.substring(0, 15),
         Leads: sourceCount[k]
      })).sort((a,b) => b.Leads - a.Leads);

      return NextResponse.json({
         text: "Ho analizzato l'origine dei tuoi Leads. Ecco la distribuzione per mezzo di acquisizione.",
         type: 'chart',
         chartType: 'bar',
         data: chartData,
         dataKey1: 'Leads'
      });
    }

    // -- 3. DOMANDA SUI PRODOTTI E-COMMERCE
    if (query.includes('prodott') || query.includes('catalog') || query.includes('magazzin')) {
      const supabaseWithAuth = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
          cookies: { getAll() { return cookieStore.getAll() }, setAll() {} },
          global: { headers: { Authorization: `Bearer ${token}` } }
      });
      const { data: products, error } = await supabaseWithAuth.from('products').select('name, price, stock');
      
      if (error) throw error;
      if (!products || products.length === 0) {
         return NextResponse.json({
            text: "Non ci sono prodotti caricati nel modulo E-Commerce.",
            type: 'text'
         });
      }

      const chartData = products.map(p => ({
         name: p.name.substring(0, 15),
         value: p.stock || 1
      })).sort((a,b) => b.value - a.value).slice(0, 5); 

      return NextResponse.json({
         text: "Ho consultato il catalogo. Ecco i top 5 prodotti per quantità in stock.",
         type: 'chart',
         chartType: 'pie',
         data: chartData
      });
    }

    return NextResponse.json({
      text: `Non ho riconosciuto metriche conosciute (fatturato, lead, prodotti) nella tua richiesta: "${body.query}". Prova a scrivermi ad esempio: "Mostrami l'andamento del fatturato" o "Da dove arrivano i lead?".`,
      type: 'text'
    });

  } catch (err: any) {
    console.error("Data Studio API Error: ", err);
    return NextResponse.json({ error: err.message || 'Errore durante l\'aggregazione dei dati.' }, { status: 500 });
  }
}
