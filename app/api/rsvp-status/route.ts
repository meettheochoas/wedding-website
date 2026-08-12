import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Public endpoint — no password required. This intentionally returns ONLY the
// guest IDs that already have an RSVP on file, nothing else (no names, no
// attending/declining status, no messages). It exists so the RSVP search
// dropdown can hide guests who've already responded, which matters when two
// invited guests share the exact same name — without this, the second person
// could accidentally select (and overwrite) the first person's real response.
export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('rsvps').select('guest_id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const respondedIds = (data || []).map((row) => row.guest_id);
  return NextResponse.json({ respondedIds });
}
