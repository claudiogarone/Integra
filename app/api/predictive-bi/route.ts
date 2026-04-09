import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const userId = user?.id || '00000000-0000-0000-0000-000000000000'

        // Raccoglie dati reali dalla piattaforma per alimentare le previsioni AI
        const [leadsRes, productsRes, reviewsRes, ordersRes] = await Promise.all([
            supabase.from('hot_leads').select('status, created_at, value').eq('user_id', userId),
            supabase.from('ecommerce_products').select('name, price, category').eq('user_id', userId),
            supabase.from('reputation_reviews').select('rating, sentiment, platform').eq('user_id', userId),
            supabase.from('ecommerce_orders').select('total_amount, status, created_at').eq('user_id', userId),
        ])

        const leads = leadsRes.data || []
        const products = productsRes.data || []
        const reviews = reviewsRes.data || []
        const orders = ordersRes.data || []

        // Calcolo metriche aggregate
        const closedLeads = leads.filter(l => l.status === 'Vinto').length
        const totalLeads = leads.length
        const winRate = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0
        const avgRating = reviews.length > 0 ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : 0
        const totalRevenue = orders.filter(o => o.status === 'paid').reduce((a, o) => a + Number(o.total_amount), 0)
        const negativeReviews = reviews.filter(r => r.sentiment === 'Negativo').length
        const churnRisk = reviews.length > 0 ? Math.round((negativeReviews / reviews.length) * 100) : 0

        // Previsione basilare deterministica (se non c'è Gemini)
        const defaultPredictions = {
            nextMonthRevenue: Math.round(totalRevenue * 1.12),
            leadConversionForecast: Math.min(winRate + 5, 95),
            churnRisk,
            topOpportunity: products.length > 0 ? products[0].name : 'Nessun prodotto ancora',
            recommendations: [
                winRate < 20 ? '🎯 Win Rate sotto il 20%: implementa uno script di follow-up a 48h dal preventivo.' : '✅ Win Rate nella media: concentrati sull\'aumento del ticket medio.',
                churnRisk > 30 ? '⚠️ Alto rischio churn: rispondi alle recensioni negative entro 24h.' : '✅ Sentiment clienti positivo: chiedi ai top-client una testimonianza.',
                totalLeads < 10 ? '📢 Pochi lead: attiva una campagna Marketing nel modulo Campagne.' : `📈 ${totalLeads} lead attivi: prioritizza i ${closedLeads} già convertiti per l'upsell.`,
            ],
            trend: totalRevenue > 1000 ? 'crescita' : 'sviluppo'
        }

        // Se esiste la chiave Gemini, usa l'AI per previsioni più sofisticate
        const geminiKey = process.env.GEMINI_API_KEY
        if (!geminiKey || leads.length === 0) {
            return NextResponse.json({ success: true, predictions: defaultPredictions, aiEnhanced: false })
        }

        const prompt = `Sei un analista finanziario AI per la piattaforma IntegraOS. Analizza questi dati aziendali e genera previsioni precise.

DATI REALI:
- Lead totali: ${totalLeads} (Win Rate: ${winRate}%)
- Fatturato ordini: €${totalRevenue.toFixed(2)}
- Prodotti nel catalogo: ${products.length}
- Recensioni medie: ${avgRating}/5 (${reviews.length} totali, ${negativeReviews} negative)
- Tasso churn stimato: ${churnRisk}%

Rispondi SOLO con un oggetto JSON valido, senza markdown:
{
  "nextMonthRevenue": (numero in euro previsto per il prossimo mese, basato su trend),
  "leadConversionForecast": (percentuale 0-100 delle conversioni previste),
  "churnRisk": (percentuale 0-100 rischio abbandono clienti),
  "topOpportunity": "descrizione breve della migliore opportunità di crescita",
  "recommendations": ["consiglio1", "consiglio2", "consiglio3"],
  "trend": "crescita" | "stabile" | "calo"
}`

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        })

        const data = await response.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
        const predictions = jsonMatch ? JSON.parse(jsonMatch[0]) : defaultPredictions

        return NextResponse.json({ success: true, predictions, aiEnhanced: true })

    } catch (error: any) {
        console.error('Predictive BI error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
