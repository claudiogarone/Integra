import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usiamo le variabili d'ambiente per connetterci a Supabase dal server
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
    try {
        // 1. Estrai l'ID dell'azienda dall'URL (es: ?userId=123)
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'Manca il userId nel Webhook' }, { status: 400 })
        }

        // 2. Leggi i dati inviati dall'E-commerce (WooCommerce, Shopify, ecc.)
        const payload = await request.json()

        // Adattiamo i dati (molti e-commerce usano nomi diversi, cerchiamo di intercettarli)
        const email = payload.billing?.email || payload.customer?.email || payload.email
        const firstName = payload.billing?.first_name || payload.customer?.first_name || payload.first_name || 'Cliente'
        const lastName = payload.billing?.last_name || payload.customer?.last_name || payload.last_name || ''
        const fullName = `${firstName} ${lastName}`.trim()
        const phone = payload.billing?.phone || payload.customer?.phone || payload.phone || ''
        const amount = Number(payload.total) || Number(payload.total_price) || 0
        const items = payload.line_items?.map((item: any) => item.name).join(', ') || 'Acquisto E-commerce'

        if (!email) {
            return NextResponse.json({ error: 'Nessuna email fornita' }, { status: 400 })
        }

        // 3. Creiamo l'oggetto Ordine
        const newOrder = {
            id: `ORD-${payload.id || Date.now()}`,
            date: new Date().toISOString(),
            amount: amount,
            channel: 'Ecommerce',
            category: 'Store Online', // In futuro potremmo estrarla dai line_items
            items: items
        }

        // 4. Cerca se il cliente esiste già nel CRM di questa azienda
        const { data: existingContact } = await supabase
            .from('contacts')
            .select('*')
            .eq('user_id', userId)
            .eq('email', email)
            .single()

        if (existingContact) {
            // IL CLIENTE ESISTE: Aggiorniamo le metriche e aggiungiamo l'ordine
            const currentOrders = Array.isArray(existingContact.orders) ? existingContact.orders : []
            const updatedOrders = [newOrder, ...currentOrders]
            
            const updatedLtv = Number(existingContact.ltv || 0) + amount
            const updatedTotalOrders = updatedOrders.length

            await supabase.from('contacts').update({
                orders: updatedOrders,
                ltv: updatedLtv,
                total_orders: updatedTotalOrders,
                last_order_date: new Date().toISOString(),
                status: 'Chiuso' // Dato che ha comprato, lo passiamo a Vinto/Chiuso
            }).eq('id', existingContact.id)

            return NextResponse.json({ message: 'Cliente aggiornato con successo' }, { status: 200 })

        } else {
            // IL CLIENTE NON ESISTE: Creiamo un nuovo contatto nel CRM
            await supabase.from('contacts').insert({
                user_id: userId,
                name: fullName,
                email: email,
                phone: phone,
                source: 'Ecommerce Automatico',
                status: 'Chiuso', // È già un cliente pagante
                ltv: amount,
                total_orders: 1,
                last_order_date: new Date().toISOString(),
                orders: [newOrder]
            })

            return NextResponse.json({ message: 'Nuovo cliente creato da E-commerce' }, { status: 200 })
        }

    } catch (error: any) {
        console.error('Errore Webhook E-commerce:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}