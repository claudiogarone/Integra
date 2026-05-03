import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET: Recupera consensi, RPO e blacklist per un contatto
// POST: Salva consenso
// DELETE: Opt-out (revoca consenso)

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const contact_id = searchParams.get('contact_id')
  const type = searchParams.get('type') || 'all' // 'consent', 'rpo', 'blacklist', 'audit', 'all'

  try {
    const result: any = {}

    if (type === 'all' || type === 'consent') {
      const q = supabase.from('privacy_consents').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: false })
      if (contact_id) q.eq('contact_id', contact_id)
      const { data } = await q.limit(200)
      result.consents = data || []
    }

    if (type === 'all' || type === 'rpo') {
      const q = supabase.from('rpo_verifications').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: false })
      if (contact_id) q.eq('contact_id', contact_id)
      const { data } = await q.limit(200)
      result.rpo = data || []
    }

    if (type === 'all' || type === 'blacklist') {
      const { data } = await supabase.from('contact_blacklist').select('*')
        .eq('user_id', user.id).eq('active', true).order('blocked_at', { ascending: false })
      result.blacklist = data || []
    }

    if (type === 'all' || type === 'audit') {
      const q = supabase.from('compliance_audit_log').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: false })
      if (contact_id) q.eq('contact_id', contact_id)
      const { data } = await q.limit(500)
      result.audit = data || []
    }

    if (type === 'all' || type === 'verbal') {
      const { data } = await supabase.from('verbal_orders').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(200)
      result.verbal_orders = data || []
    }

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action } = body

  try {
    if (action === 'save_consent') {
      const { data, error } = await supabase.from('privacy_consents').upsert({
        user_id: user.id,
        contact_id: body.contact_id || null,
        contact_name: body.contact_name,
        contact_email: body.contact_email,
        contact_phone: body.contact_phone,
        consent_phone: body.consent_phone ?? false,
        consent_email: body.consent_email ?? false,
        consent_sms: body.consent_sms ?? false,
        consent_profiling: body.consent_profiling ?? false,
        consent_third_party: body.consent_third_party ?? false,
        source: body.source || 'manual',
        source_detail: body.source_detail || null,
        acquisition_ip: body.acquisition_ip || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' }).select().single()

      if (error) throw error

      // Audit log
      await supabase.from('compliance_audit_log').insert({
        user_id: user.id,
        event_type: 'consent_given',
        event_description: `Consenso registrato per ${body.contact_name || body.contact_email || body.contact_phone}`,
        contact_id: body.contact_id || null,
        contact_name: body.contact_name,
        contact_phone: body.contact_phone,
        contact_email: body.contact_email,
        metadata: {
          consent_phone: body.consent_phone,
          consent_email: body.consent_email,
          consent_sms: body.consent_sms,
          consent_profiling: body.consent_profiling,
          source: body.source
        }
      })

      return NextResponse.json({ success: true, data })
    }

    if (action === 'rpo_check') {
      // Simula verifica RPO (in produzione si integra con l'API ufficiale del Registro)
      const phone = body.phone_number
      const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // +15 giorni

      // TODO: Integrare con API ufficiale RPO: https://www.registrodelleopposizioni.it/
      // Per ora: registra la verifica manuale con lo status fornito
      const { data, error } = await supabase.from('rpo_verifications').insert({
        user_id: user.id,
        contact_id: body.contact_id || null,
        phone_number: phone,
        is_registered: body.is_registered ?? false,
        verification_status: body.is_registered ? 'registered' : 'clear',
        verified_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        verified_by: 'manual',
        notes: body.notes || null
      }).select().single()

      if (error) throw error

      // Se iscritto al RPO → aggiungi alla blacklist automaticamente
      if (body.is_registered) {
        await supabase.from('contact_blacklist').upsert({
          user_id: user.id,
          contact_value: phone,
          contact_type: 'phone',
          reason: 'Iscritto al Registro delle Opposizioni (RPO)',
          reason_type: 'rpo',
          blocked_by: 'system'
        }, { onConflict: 'user_id,contact_value,contact_type' })
      }

      // Audit log
      await supabase.from('compliance_audit_log').insert({
        user_id: user.id,
        event_type: 'rpo_check',
        event_description: `Verifica RPO per ${phone}: ${body.is_registered ? '🔴 ISCRITTO — Contatto bloccato' : '🟢 LIBERO — Contattabile'}`,
        contact_id: body.contact_id || null,
        contact_phone: phone,
        metadata: { is_registered: body.is_registered, expires_at: expiresAt.toISOString() }
      })

      return NextResponse.json({ success: true, data, expires_at: expiresAt })
    }

    if (action === 'add_blacklist') {
      const { data, error } = await supabase.from('contact_blacklist').upsert({
        user_id: user.id,
        contact_value: body.contact_value,
        contact_type: body.contact_type || 'phone',
        reason: body.reason,
        reason_type: body.reason_type || 'opt_out',
        blocked_by: body.blocked_by || 'manual',
        active: true,
        notes: body.notes || null
      }, { onConflict: 'user_id,contact_value,contact_type' }).select().single()

      if (error) throw error

      // Audit log
      await supabase.from('compliance_audit_log').insert({
        user_id: user.id,
        event_type: 'blacklist_add',
        event_description: `${body.contact_value} aggiunto alla blacklist: ${body.reason}`,
        contact_phone: body.contact_type === 'phone' ? body.contact_value : null,
        contact_email: body.contact_type === 'email' ? body.contact_value : null,
        metadata: { reason_type: body.reason_type }
      })

      return NextResponse.json({ success: true, data })
    }

    if (action === 'revoke_consent') {
      await supabase.from('privacy_consents').update({
        opted_out_at: new Date().toISOString(),
        opt_out_reason: body.reason || 'Revoca da parte del contatto',
        consent_phone: false, consent_email: false, consent_sms: false,
        consent_profiling: false, consent_third_party: false,
        updated_at: new Date().toISOString()
      }).eq('id', body.consent_id).eq('user_id', user.id)

      // Audit log
      await supabase.from('compliance_audit_log').insert({
        user_id: user.id,
        event_type: 'consent_revoked',
        event_description: `Consenso revocato: ${body.reason || 'Opt-out richiesto'}`,
        contact_id: body.contact_id || null,
        metadata: { consent_id: body.consent_id }
      })

      return NextResponse.json({ success: true })
    }

    if (action === 'save_verbal_order') {
      const { data, error } = await supabase.from('verbal_orders').insert({
        user_id: user.id,
        contact_id: body.contact_id || null,
        contact_name: body.contact_name,
        contact_phone: body.contact_phone,
        confirmation_type: body.confirmation_type || 'verbal',
        call_date: body.call_date || new Date().toISOString(),
        call_duration_seconds: body.call_duration_seconds || null,
        cli_number: body.cli_number,
        roc_registered: body.roc_registered ?? false,
        recording_url: body.recording_url || null,
        recording_consent: body.recording_consent ?? false,
        script_followed: body.script_followed ?? false,
        operator_id: body.operator_id || null,
        status: body.status || 'pending',
        contract_accepted: body.contract_accepted ?? false,
        notes: body.notes || null
      }).select().single()

      if (error) throw error

      // Audit log
      await supabase.from('compliance_audit_log').insert({
        user_id: user.id,
        event_type: 'verbal_order',
        event_description: `Verbal Order registrato per ${body.contact_name}: ${body.contract_accepted ? 'Accettato ✅' : 'Non concluso'}`,
        contact_id: body.contact_id || null,
        contact_name: body.contact_name,
        contact_phone: body.contact_phone,
        metadata: {
          confirmation_type: body.confirmation_type,
          cli_number: body.cli_number,
          roc_registered: body.roc_registered,
          recording_consent: body.recording_consent
        }
      })

      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const id = searchParams.get('id')

  if (type === 'blacklist' && id) {
    await supabase.from('contact_blacklist').update({ active: false }).eq('id', id).eq('user_id', user.id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}
