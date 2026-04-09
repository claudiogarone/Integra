import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

// GET: Recupera assessments benessere
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

        const { data, error } = await supabase
            .from('wellness_assessments')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) throw error
        return NextResponse.json({ assessments: data || [] })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// POST: Salva un nuovo assessment o genera analisi AI
export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

        const body = await req.json()

        // Se è richiesta analisi AI
        if (body.action === 'analyze') {
            const apiKey = process.env.GEMINI_API_KEY
            if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY mancante' }, { status: 500 })

            const dimensions = [
                { name: 'Comunicazione Interna', score: body.communication },
                { name: 'Rispetto Procedure', score: body.procedures },
                { name: 'Formazione', score: body.training },
                { name: 'Allineamento Obiettivi', score: body.goal_alignment },
                { name: 'Sistema Premiante', score: body.reward_system },
                { name: 'Status del Brand', score: body.brand_status },
                { name: 'Opportunità di Carriera', score: body.career_opportunities },
                { name: 'Benefit e Vantaggi', score: body.benefits },
            ]

            const riskDimensions = dimensions.filter(d => d.score <= 4)
            const okDimensions = dimensions.filter(d => d.score >= 8)

            const prompt = `Sei un consulente di organizzazione aziendale. Analizza questi punteggi di benessere aziendale (1-10) e fornisci un report operativo in italiano.

PUNTEGGI:
${dimensions.map(d => `- ${d.name}: ${d.score}/10 (${d.score <= 4 ? '🔴 RISCHIO' : d.score >= 8 ? '🟢 OPPORTUNITÀ' : '🟡 NEUTRO'})`).join('\n')}

AREE DI RISCHIO: ${riskDimensions.map(d => d.name).join(', ') || 'Nessuna'}
AREE ECCELLENTI: ${okDimensions.map(d => d.name).join(', ') || 'Nessuna'}
MEDIA TOTALE: ${(dimensions.reduce((a, d) => a + d.score, 0) / 8).toFixed(1)}/10

Rispondi in JSON:
{
  "overall_rating": "Eccellente|Buono|Sufficiente|Critico",
  "priority_actions": ["azione 1", "azione 2", "azione 3"],
  "risk_analysis": "analisi delle aree a rischio",
  "opportunity_analysis": "analisi delle aree di crescita",
  "recommendation": "raccomandazione principale per il prossimo trimestre"
}`

            const { GoogleGenerativeAI } = await import('@google/generative-ai')
            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
            const result = await model.generateContent(prompt)
            const text = result.response.text()

            const jsonMatch = text.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                return NextResponse.json({ analysis: JSON.parse(jsonMatch[0]) })
            }
            return NextResponse.json({ analysis: { recommendation: text } })
        }

        // Altrimenti salva l'assessment
        const { period, communication, procedures, training, goal_alignment, reward_system, brand_status, career_opportunities, benefits, notes } = body

        const { data, error } = await supabase
            .from('wellness_assessments')
            .insert({
                user_id: user.id, period, communication, procedures, training,
                goal_alignment, reward_system, brand_status, career_opportunities, benefits, notes
            })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ assessment: data })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
