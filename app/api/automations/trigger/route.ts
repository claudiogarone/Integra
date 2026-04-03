import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

export async function POST(req: Request) {
    try {
        const { triggerType, payload, userId } = await req.json()
        
        if (!userId || !triggerType) {
            return NextResponse.json({ error: 'Mancano parametri fondamentali' }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Trova le automazioni attive per questo tipo di trigger
        const { data: automations, error: autoError } = await supabase
            .from('automations')
            .select('*')
            .eq('user_id', userId)
            .eq('status', true)

        if (autoError) throw autoError

        // Filtriamo quelle che iniziano con il trigger richiesto
        const activeWorkflows = automations.filter(auto => {
            const config = auto.configuration || []
            return config.length > 0 && config[0].title.toLowerCase().includes(triggerType.toLowerCase())
        })

        if (activeWorkflows.length === 0) {
            return NextResponse.json({ message: 'Nessuna automazione attiva per questo trigger' })
        }

        const results = []

        // 2. Esegui ogni workflow
        for (const workflow of activeWorkflows) {
            const executionResult = await executeWorkflow(workflow, payload, userId, supabase)
            results.push({
                workflowId: workflow.id,
                result: executionResult
            })
            
            // Aggiorniamo il numero di esecuzioni nel database
            await supabase.from('automations')
                .update({ runs: (workflow.runs || 0) + 1 })
                .eq('id', workflow.id)
        }

        return NextResponse.json({ success: true, executions: results })

    } catch (error: any) {
        console.error("❌ AUTOMATION TRIGGER ERROR:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

async function executeWorkflow(workflow: any, payload: any, userId: string, supabase: any) {
    const flow = workflow.configuration || []
    if (flow.length < 2) return { status: 'skipped', reason: 'Flow too short' }

    let currentContext = { ...payload }
    let logs = []

    // Saltiamo il primo nodo (trigger) perché è quello che ha scatenato tutto
    for (let i = 1; i < flow.length; i++) {
        const node = flow[i]
        
        try {
            switch (node.type) {
                case 'action':
                    await handleAction(node, currentContext, userId, supabase)
                    break
                case 'condition':
                    const conditionMet = evaluateCondition(node, currentContext)
                    if (!conditionMet) {
                        return { status: 'stopped', atNode: node.id, reason: 'Condition not met' }
                    }
                    break
                case 'delay':
                    // In una versione reale useremmo un worker o un cron job
                    // Per ora facciamo un log e proseguiamo (o un piccolo sleep se brevissimo)
                    console.log(`Pausa simulata: ${node.config?.time} ${node.config?.unit}`)
                    break
                case 'ai_processor':
                    const aiOutput = await handleAIProcessor(node, currentContext)
                    currentContext.ai_processed_data = aiOutput
                    break
            }
        } catch (err: any) {
            await logExecution(workflow, 'failed', `Errore nel nodo ${node.title}: ${err.message}`, userId, payload, supabase)
            return { status: 'failed', error: err.message, node: node.id }
        }
    }

    await logExecution(workflow, 'success', 'Eseguito con successo', userId, payload, supabase)
    return { status: 'success' }
}

async function handleAction(node: any, context: any, userId: string, supabase: any) {
    console.log(`Executing action: ${node.title} for ${context.email || 'unknown'}`)
    
    if (node.title.includes('WhatsApp')) {
        // Logica WhatsApp (già presente in app/actions/chatwoot.ts)
    } else if (node.title.includes('Email')) {
        // Logica Email (Resend)
    }
}

function evaluateCondition(node: any, context: any) {
    const { rule, value } = node.config || {}
    if (!rule || !value) return true

    if (rule === 'Ha Acquistato Prima?') {
        return context.total_orders > 1
    }
    // Altre logiche...
    return true
}

async function handleAIProcessor(node: any, context: any) {
    const prompt = `Analizza questa interazione cliente e genera una risposta personalizzata: ${JSON.stringify(context)}`
    const result = await model.generateContent(prompt)
    return result.response.text()
}

async function logExecution(workflow: any, status: string, message: string, userId: string, payload: any, supabase: any) {
    await supabase.from('automation_logs').insert({
        automation_id: workflow.id,
        user_id: userId,
        workflow_name: workflow.name,
        trigger_event: workflow.configuration[0]?.title || 'Unknown',
        status: status,
        error_message: status === 'failed' ? message : null,
        saved_time: '1 min',
        payload: payload
    })
}
