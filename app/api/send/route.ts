import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { subject, content, emails } = await request.json();

    // Invio reale tramite Resend
    const data = await resend.emails.send({
      from: 'Integra <onboarding@resend.dev>', // Usa questo finché non verifichi il tuo dominio
      to: emails, // Array di destinatari
      subject: subject,
      html: `<p>${content}</p><br><hr><p><small>Inviato da Integra Platform</small></p>`,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}