import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

// GET /api/rsvp?guestId=g001 -> { rsvp: {...} | null }
export async function GET(req: NextRequest) {
  const guestId = req.nextUrl.searchParams.get('guestId');
  if (!guestId) {
    return NextResponse.json({ error: 'guestId is required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('rsvps')
    .select('*')
    .eq('guest_id', guestId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ rsvp: null });
  }

  return NextResponse.json({
    rsvp: {
      guestId: data.guest_id,
      guestName: data.guest_name,
      attending: data.attending,
      submittedAt: data.submitted_at,
    },
  });
}

// POST /api/rsvp  { guestId, guestName, attending: 'yes' | 'no' }
export async function POST(req: NextRequest) {
  let body: { guestId?: string; guestName?: string; attending?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { guestId, guestName, attending } = body;

  if (!guestId || !guestName || (attending !== 'yes' && attending !== 'no')) {
    return NextResponse.json({ error: 'guestId, guestName, and attending (yes/no) are required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Check if this guest already has an RSVP on file (for the "new vs update" email wording)
  const { data: existing } = await supabase
    .from('rsvps')
    .select('id')
    .eq('guest_id', guestId)
    .maybeSingle();

  const isUpdate = !!existing;
  const submittedAt = new Date().toISOString();

  const { error: upsertError } = await supabase
    .from('rsvps')
    .upsert(
      {
        guest_id: guestId,
        guest_name: guestName,
        attending,
        submitted_at: submittedAt,
      },
      { onConflict: 'guest_id' }
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // Send the email notification — failures here should not block the guest's RSVP from succeeding
  try {
    await sendRsvpEmail({ guestName, attending, isUpdate });
  } catch (emailError) {
    console.error('RSVP saved, but email notification failed:', emailError);
  }

  return NextResponse.json({ ok: true });
}

async function sendRsvpEmail({
  guestName,
  attending,
  isUpdate,
}: {
  guestName: string;
  attending: string;
  isUpdate: boolean;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyTo = process.env.NOTIFY_EMAIL || 'meettheochoas@gmail.com';
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping email notification.');
    return;
  }

  const resend = new Resend(apiKey);
  const statusLabel = attending === 'yes' ? 'Attending' : 'Declined';
  const actionLabel = isUpdate ? 'updated their RSVP' : 'submitted a new RSVP';

  await resend.emails.send({
    // Use Resend's shared sending domain until you verify your own domain in Resend.
    from: 'Wedding RSVP <onboarding@resend.dev>',
    to: notifyTo,
    subject: `RSVP: ${guestName} — ${statusLabel}`,
    html: `
      <p><strong>${guestName}</strong> just ${actionLabel}.</p>
      <p><strong>Status:</strong> ${statusLabel}</p>
      <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
    `,
  });
}
