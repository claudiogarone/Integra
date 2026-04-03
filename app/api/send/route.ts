import { Resend } from 'resend';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const { subject, content, emails } = await request.json();

    const data = await resend.emails.send({
      from: 'Integra <onboarding@resend.dev>',
      to: emails,
      subject: subject,
      html: content, // Passiamo direttamente l'HTML che costruiamo nelle pagine
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}