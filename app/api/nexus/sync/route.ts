import { createClient } from '../../../../utils/supabase/server'
import { NextResponse } from 'next/server'

/**
 * ENGINE DI SINCRONIZZAZIONE NEXUS (Marketing, Social e Ambiente)
 * Questo endpoint aggrega i dati da Google Ads, FaceBook Ads, Meteo e ISTAT.
 */

export async function POST(req: Request) {
    const supabase = await createClient();
    const { userId } = await req.json();

    if (!userId) {
        return NextResponse.json({ error: 'UserID mancante' }, { status: 400 });
    }

    try {
        // 1. RECUPERA TOKEN E CONFIGURAZIONI (da tabella integrations)
        const { data: integrations } = await supabase
            .from('integrations')
            .select('*')
            .eq('user_id', userId);

        // 2. RECUPERA PROFILO (per la città del meteo)
        const { data: profile } = await supabase
            .from('profiles')
            .select('city')
            .eq('id', userId)
            .single();

        const results = [];
        const today = new Date().toISOString().split('T')[0];

        // --- GOOGLE ADS MOCK / REAL ---
        // In una versione finale, qui useremmo i token di 'integrations' per chiamare Google Ads API
        results.push({
            user_id: userId,
            date: today,
            source: 'google_ads',
            metric_name: 'spend',
            metric_value: 45.60 + (Math.random() * 20), // Simulazione spesa
            metadata: { currency: 'EUR', status: 'mock' }
        });

        // --- FACEBOOK ADS MOCK / REAL ---
        results.push({
            user_id: userId,
            date: today,
            source: 'fb_ads',
            metric_name: 'spend',
            metric_value: 30.15 + (Math.random() * 15),
            metadata: { currency: 'EUR', status: 'mock' }
        });

        // --- METEO (OPENWEATHERMAP) ---
        // Se abbiamo la città, possiamo simulare o chiamare un'API reale
        const city = profile?.city || 'Milano';
        results.push({
            user_id: userId,
            date: today,
            source: 'weather',
            metric_name: 'temp',
            metric_value: 12 + (Math.random() * 10), // Temperatura simulata
            metadata: { city, condition: 'Clear' }
        });

        // --- ISTAT (CPI - INDICE PREZZI AL CONSUMO) ---
        results.push({
            user_id: userId,
            date: today,
            source: 'istat',
            metric_name: 'inflation_rate',
            metric_value: 1.2, // Mock valore ISTAT
            metadata: { index: 'NIC', year: 2026 }
        });

        // 3. SALVATAGGIO MASSIVO SU SUPABASE
        const { error: upsertError } = await supabase
            .from('marketing_metrics')
            .upsert(results, { onConflict: 'user_id, date, source, metric_name' });

        if (upsertError) throw upsertError;

        return NextResponse.json({ 
            success: true, 
            message: "Sincronizzazione Nexus completata con successo",
            syncedMetrics: results.length
        });

    } catch (err: any) {
        console.error("Errore Nexus Sync:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
