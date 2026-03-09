import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { subject, content, recipients, campaign_id, catalog_products, custom_product, company_name, company_logo } = await request.json();

    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: 'Manca la chiave RESEND' }, { status: 500 });

    const resend = new Resend(apiKey);

    if (!recipients || recipients.length === 0) return NextResponse.json({ error: 'Nessun destinatario valido.' }, { status: 400 });

    // =========================================================
    // COSTRUTTORE VETRINA HTML DEI PRODOTTI
    // =========================================================
    let productsHtml = '';
    
    if (catalog_products && catalog_products.length > 0) {
        productsHtml += `<div style="margin-top: 40px;">
                           <h3 style="color: #00665E; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; font-family: Arial, sans-serif;">🛍️ Prodotti in Evidenza per Te</h3>`;
        
        catalog_products.forEach((p: any) => {
            const price = p.price ? Number(p.price).toLocaleString('it-IT', { minimumFractionDigits: 2 }) : '0,00';
            const imageUrl = p.image_url && !p.image_url.includes('Senza+Foto') ? p.image_url : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80'; 
            
            productsHtml += `
              <div style="margin-top: 20px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; font-family: Arial, sans-serif; background-color: #f8fafc;">
                  <img src="${imageUrl}" alt="${p.name}" style="width: 100%; height: 240px; object-fit: cover; border-bottom: 1px solid #e2e8f0; display: block;" />
                  <div style="padding: 24px;">
                      <h4 style="margin: 0 0 10px 0; font-size: 20px; color: #1e293b;">${p.name}</h4>
                      <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b; line-height: 1.6;">${p.description || ''}</p>
                      <div style="display: block;">
                          <span style="font-size: 24px; font-weight: 900; color: #00665E; display: block; margin-bottom: 15px;">€ ${price}</span>
                          <a href="https://tuosito.com" style="background-color: #00665E; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Acquista Ora</a>
                      </div>
                  </div>
              </div>
            `;
        });
        productsHtml += `</div>`;
    }

    if (custom_product && custom_product.name) {
         productsHtml += `
             <div style="margin-top: 30px; padding: 24px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; font-family: Arial, sans-serif; text-align: center;">
                 <h3 style="margin: 0 0 10px 0; color: #1e3a8a;">🔥 Offerta Speciale Esclusiva</h3>
                 <h4 style="margin: 0 0 10px 0; font-size: 22px; color: #1e40af;">${custom_product.name}</h4>
                 <span style="font-size: 28px; font-weight: 900; color: #2563eb; display: block; margin-bottom: 20px;">€ ${custom_product.price}</span>
                 <a href="${custom_product.url}" style="background-color: #2563eb; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; display: inline-block;">Scopri l'Offerta</a>
             </div>
         `;
    }

    // =========================================================
    // HEADER AZIENDALE INFALLIBILE
    // Se c'è un logo prova a usarlo, altrimenti usa un design elegante di testo
    // =========================================================
    const finalCompanyName = company_name || 'Comunicazione Aziendale';
    const firstLetter = finalCompanyName.charAt(0).toUpperCase();
    
    // Costruiamo un header molto pulito che non si rompe
    const topHeaderHtml = `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
          <tr>
              <td style="text-align: center;">
                  ${company_logo && company_logo.trim() !== '' && company_logo.startsWith('http') 
                      ? `<img src="${company_logo}" alt="${finalCompanyName}" style="max-height: 80px; max-width: 250px; display: block; margin: 0 auto;" />` 
                      : `
                      <div style="background-color: #1e293b; color: white; width: 50px; height: 50px; border-radius: 12px; font-size: 24px; font-weight: bold; line-height: 50px; margin: 0 auto 10px auto;">
                          ${firstLetter}
                      </div>
                      <h2 style="color: #1e293b; margin:0; letter-spacing: 1px; font-weight: 900; text-transform: uppercase;">
                          ${finalCompanyName}
                      </h2>
                      `
                  }
              </td>
          </tr>
      </table>
    `;

    // =========================================================
    // INVIO A TUTTI I DESTINATARI
    // =========================================================
    const emailPromises = recipients.map(async (recipient: any) => {
        const personalizedContent = content.replace(/{{name}}/g, recipient.name || 'Cliente');

        return resend.emails.send({
            from: `${finalCompanyName} <onboarding@resend.dev>`, 
            to: recipient.email, 
            subject: subject,
            html: `
              <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                  
                  <!-- HEADER: LOGO AZIENDA -->
                  <div style="text-align: center; margin-bottom: 35px;">
                     ${topHeaderHtml}
                  </div>
                  
                  <!-- TESTO PRINCIPALE -->
                  <div style="font-size: 16px; line-height: 1.7; color: #334155;">
                    ${personalizedContent.replace(/\n/g, '<br>')}
                  </div>
                  
                  <!-- PRODOTTI -->
                  ${productsHtml}

                  <br><br>

                  <!-- FOOTER AZIENDALE DI BASE -->
                  <div style="color:#94a3b8; font-size: 12px; text-align: center; line-height: 1.5;">
                    <p style="margin: 0 0 10px 0;">Hai ricevuto questa comunicazione perché sei iscritto alla nostra lista clienti.</p>
                    <p style="margin: 0; font-family: monospace; color: #cbd5e1;">Ref: ${campaign_id || 'TEST'}</p>
                  </div>

                  <!-- BADGE POWERED BY INTEGRAOS (CREATO IN HTML PURO, INDISTRUTTIBILE) -->
                  <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0; text-align: center;">
                      <p style="margin: 0 0 12px 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Campagna generata e inviata tramite</p>
                      
                      <a href="https://integraos.it" target="_blank" style="text-decoration: none; display: inline-block;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                              <tr>
                                  <!-- Il quadratino verde con la I -->
                                  <td style="background-color: #00665E; color: white; border-radius: 8px; width: 32px; height: 32px; text-align: center; font-weight: 900; font-size: 18px;">
                                      I
                                  </td>
                                  <!-- Il testo affiancato -->
                                  <td style="padding-left: 10px; font-size: 22px; font-weight: 900; color: #00665E; letter-spacing: -0.5px;">
                                      INTEGRA<span style="font-weight: 300; color: #64748b;">OS</span>
                                  </td>
                              </tr>
                          </table>
                      </a>
                      
                      <p style="margin: 12px 0 0 0; font-size: 11px; color: #cbd5e1;">Piattaforma Enterprise per Automazioni & Marketing</p>
                  </div>

              </div>
            `,
            tags: campaign_id ? [{ name: 'campaign_id', value: String(campaign_id) }] : []
        });
    });

    const results = await Promise.allSettled(emailPromises);
    const failed = results.filter(r => r.status === 'rejected');
    
    return NextResponse.json({ 
        success: true, 
        sent: recipients.length - failed.length, 
        failed: failed.length 
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}