import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
        const { triggerType, payload, userId } = await req.json()
        
        if (!userId || !triggerType) {
            return NextResponse.json({ error: 'Mancano parametri fondamentali' }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Trova i workflow attivi per questo tipo di trigger
        const { data: workflows, error: wfError } = await supabase
            .from('workflows')
            .select('*')
            .eq('user_id', userId)
            .eq('status', true)

        if (wfError) throw wfError

        // Filtriamo quelli che iniziano con il trigger richiesto (es: "Nuovo Lead")
        const activeWorkflows = workflows.filter(wf => {
            const config = wf.configuration || []
            return config.length > 0 && config[0].title.toLowerCase().includes(triggerType.toLowerCase())
        })

        if (activeWorkflows.length === 0) {
            return NextResponse.json({ message: `Nessun workflow attivo per: ${triggerType}` })
        }

        const results = []

        // 2. Esegui ogni workflow
        for (const workflow of activeWorkflows) {
            const executionResult = await executeCRMWorkflow(workflow, payload, userId, supabase, model)
            results.push({
                workflowId: workflow.id,
                result: executionResult
            })
            
            // Aggiorniamo il numero di esecuzioni
            await supabase.from('workflows')
                .update({ runs: (workflow.runs || 0) + 1 })
                .eq('id', workflow.id)
        }

        return NextResponse.json({ success: true, executions: results })

    } catch (error: any) {
        console.error("❌ WORKFLOW ENGINE ERROR:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

async function executeCRMWorkflow(workflow: any, payload: any, userId: string, supabase: any, model: any) {
    const flow = workflow.configuration || []
    if (flow.length < 2) return { status: 'skipped', reason: 'Flow too short' }

    let currentContext = { ...payload }

    for (let i = 1; i < flow.length; i++) {
        const node = flow[i]
        
        try {
            switch (node.type) {
                case 'action':
                    await handleCRMAction(node, currentContext, userId, supabase)
                    break
                case 'condition':
                    const conditionMet = evaluateCRMCondition(node, currentContext)
                    if (!conditionMet) {
                        return { status: 'stopped', atNode: node.id, reason: 'Condition not met' }
                    }
                    break
                case 'delay':
                    // Inseriamo l'entrata nel workflow_entries per gestire il follow-up ritardato
                    await supabase.from('workflow_entries').insert({
                        workflow_id: workflow.id,
                        contact_id: payload.id || null,
                        current_node_id: node.id,
                        status: 'waiting',
                        next_execution: calculateNextExecution(node.config),
                        payload: currentContext
                    })
                    // Interrompiamo l'esecuzione sincrona qui, riprenderà dal worker
                    return { status: 'waiting', atNode: node.id }
                case 'ai_processor':
        const aiResult = await handleWorkflowAI(node, currentContext, model)
                    currentContext.ai_insights = aiResult
                    break
            }
        } catch (err: any) {
            await logWorkflow(workflow, 'failed', `Error node ${node.title}: ${err.message}`, userId, payload, supabase)
            return { status: 'failed', error: err.message }
        }
    }

    await logWorkflow(workflow, 'success', 'Workflow concluso', userId, payload, supabase)
    return { status: 'success' }
}

async function handleCRMAction(node: any, context: any, userId: string, supabase: any) {
    console.log(`CRM Action: ${node.title} per ${context.email || 'lead'}`)
    // Qui andrebbe la logica REALE di invio Email/WA usando i template del CRM
}

function evaluateCRMCondition(node: any, context: any) {
    const { rule, value } = node.config || {}
    if (!rule || !value) return true
    
    if (rule === 'Stato Preventivo') {
        return context.status === value
    }
    return true
}

async function handleWorkflowAI(node: any, context: any, model: any) {
    const prompt = `Analizza questo lead e suggerisci un'azione: ${JSON.stringify(context)}`
    const result = await model.generateContent(prompt)
    return result.response.text()
}

function calculateNextExecution(config: any) {
    const now = new Date()
    const { time = 1, unit = 'Giorni' } = config
    const ms = unit === 'Minuti' ? time * 60000 : unit === 'Ore' ? time * 3600000 : time * 86400000
    return new Date(now.getTime() + ms).toISOString()
}

async function logWorkflow(workflow: any, status: string, message: string, userId: string, payload: any, supabase: any) {
    await supabase.from('workflow_logs').insert({
        workflow_id: workflow.id,
        user_id: userId,
        workflow_name: workflow.name,
        trigger_event: workflow.configuration[0]?.title || 'Trigger CRM',
        status: status,
        error_message: status === 'failed' ? message : null,
        payload: payload
    })
}
