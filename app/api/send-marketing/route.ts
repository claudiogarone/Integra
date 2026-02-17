import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { subject, content, recipients } = await request.json();

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Manca API Key' }, { status: 500 });
    }

    // Loop per inviare le email (Resend Free supporta invii singoli o batch piccoli)
    // Nota: In produzione Enterprise useremmo "resend.batch.send"
    const emailPromises = recipients.map(async (recipient: any) => {
        // Personalizzazione del testo (Es. Ciao Claudio)
        const personalizedContent = content.replace('{{name}}', recipient.name || 'Cliente');
        
        return resend.emails.send({
            from: 'IntegraOS Marketing <onboarding@resend.dev>', // Indirizzo Test
            to: recipient.email, // ⚠️ IN TEST MODE: Funziona solo verso la TUA email
            subject: subject,
            text: personalizedContent, // Fallback testo semplice
            // Qui potremmo mettere HTML complesso in futuro
            html: `<div style="font-family: sans-serif; color: #333;">
                    ${personalizedContent.replace(/\n/g, '<br>')}
                    <br><br>
                    <hr style="border:0; border-top:1px solid #eee;">
                    <small style="color:#999;">Hai ricevuto questa mail perché sei iscritto al programma fedeltà.</small>
                   </div>` 
        });
    });

    // Attendi che partano tutte
    await Promise.all(emailPromises);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Errore Resend:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}