import { createClient } from '../../../../../utils/supabase/server'
import { NextResponse } from 'next/server'

/**
 * ENGINE DI ANIMAZIONE AVATAR (Economico via Replicate)
 * Costo stimato: ~$0.08 per video da 10s.
 */

export async function POST(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    try {
        const { avatarId, text } = await req.json()

        // 1. RECUPERA AVATAR DA SUPABASE
        const { data: avatar, error: avatarError } = await supabase
            .from('ai_avatars')
            .select('*')
            .eq('id', avatarId)
            .single()

        if (avatarError || !avatar) throw new Error("Avatar non trovato")

        // 2. GENERAZIONE AUDIO (MOCK O ELEVENLABS)
        // In produzione qui chiameremmo ElevenLabs e caricheremmo l'MP3 su Supabase Storage
        const mockAudioUrl = "https://www.learningcontainer.com/wp-content/uploads/2020/02/Sample-OGG-File.ogg"

        // 3. CHIAMATA A REPLICATE (SADTALKER)
        // Usiamo l'SDK di Replicate o fetch standard
        const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN
        
        if (!REPLICATE_API_TOKEN) {
            // DEMO MODE: Se non ci sono chiavi, restituiamo un video di esempio realistico
            const demoVideo = "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4" // Placeholder
            
            await supabase.from('ai_avatars').update({ avatar_video_url: demoVideo }).eq('id', avatarId)
            
            return NextResponse.json({ 
                success: true, 
                videoUrl: demoVideo, 
                message: "Demo Mode: Video generato con successo (Configura REPLICATE_API_TOKEN per video reali)" 
            })
        }

        const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Token ${REPLICATE_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                version: "3aa3da9e10582f2979103ee23ef6ad345156a951c35639f7d4323e0c06af46fe", // SadTalker model version
                input: {
                    source_image: avatar.avatar_img_url,
                    driven_audio: mockAudioUrl,
                    preprocess: "full",
                    still: true,
                    enhancer: "gfpgan" // Migliora la qualità del volto
                },
            }),
        });

        const prediction = await response.json();
        
        // REPLICATE è asincrono. Qui dovremmo gestire il polling o restituire l'ID della predizione.
        // Per semplicità per l'utente, diciamo che è stato avviato.
        
        return NextResponse.json({ 
            success: true, 
            predictionId: prediction.id,
            status: prediction.status
        });

    } catch (err: any) {
        console.error("Errore Animazione:", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
