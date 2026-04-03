
export async function triggerWorkflow(triggerType: string, payload: any, userId: string) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        
        // Chiamata asincrona all'API dei workflow per non bloccare il chiamante
        await fetch(`${baseUrl}/api/workflows/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ triggerType, payload, userId })
        }).catch(err => console.error("Error triggering crm workflow:", err))
        
        return { success: true }
    } catch (error) {
        console.error("Failed to trigger crm workflow logic:", error)
        return { success: false, error }
    }
}
