import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, event, agents, companyName } = body;

        const apiKey = process.env.RESEND_API_KEY?.trim();
        if (!apiKey) return NextResponse.json({ error: 'Manca la chiave RESEND' }, { status: 500 });
        const resend = new Resend(apiKey);

        const emailPromises = agents.map(async (agent: any) => {
            let subject = '';
            let htmlContent = '';

            // 1. EMAIL TIPO: REMINDER DIRETTA CON CALENDARIO
            if (type === 'reminder') {
                subject = `📅 Reminder: ${event.title} - ${companyName}`;
                
                // Creazione Link Google Calendar
                const startDate = new Date(event.start_time);
                const endDate = new Date(startDate.getTime() + (event.duration_minutes || 60) * 60000);
                
                const formatGoogleDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
                const gCalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&details=${encodeURIComponent("Entra qui: " + event.platform_link)}`;

                htmlContent = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; text-align: center;">
                        <h2 style="color: #00665E;">Ciao ${agent.name},</h2>
                        <p style="color: #475569; font-size: 16px;">Ti ricordiamo l'appuntamento per la diretta formativa:</p>
                        
                        <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: left;">
                            <h3 style="margin: 0 0 10px 0; color: #1e293b;">${event.title}</h3>
                            <p style="margin: 0 0 5px 0; color: #64748b;">🗓️ <strong>Data:</strong> ${startDate.toLocaleDateString('it-IT')}</p>
                            <p style="margin: 0; color: #64748b;">⏰ <strong>Ora:</strong> ${startDate.toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>

                        <a href="${event.platform_link}" style="background-color: #DC2626; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-bottom: 20px;">🎥 Entra nella Diretta</a>
                        <br>
                        <a href="${gCalLink}" target="_blank" style="color: #00665E; font-weight: bold; text-decoration: underline; font-size: 14px;">📅 Aggiungi a Google Calendar</a>
                    </div>
                `;
            } 
            // 2. EMAIL TIPO: RILASCIO ATTESTATO
            else if (type === 'certificate') {
                subject = `🏆 Congratulazioni! Il tuo attestato è pronto - ${companyName}`;
                
                htmlContent = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; text-align: center;">
                        <div style="font-size: 50px; margin-bottom: 10px;">🎓</div>
                        <h2 style="color: #00665E;">Ottimo lavoro, ${agent.name}!</h2>
                        <p style="color: #475569; font-size: 16px;">Hai completato con successo la formazione: <strong>${event.title}</strong>.</p>
                        
                        <p style="color: #64748b; font-size: 14px; margin: 30px 0;">Il tuo attestato di partecipazione ufficiale è stato generato ed è disponibile nel tuo portale studente.</p>

                        <a href="#" style="background-color: #F59E0B; color: #451a03; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Scarica il tuo Attestato</a>
                        
                        <p style="font-size: 11px; color: #94a3b8; margin-top: 30px;">Inviato da ${companyName} tramite IntegraOS Academy</p>
                    </div>
                `;
            }

            return resend.emails.send({
                from: `${companyName} Academy <onboarding@resend.dev>`, 
                to: agent.email,
                subject: subject,
                html: htmlContent
            });
        });

        await Promise.allSettled(emailPromises);
        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}