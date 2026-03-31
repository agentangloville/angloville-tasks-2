import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== 'av-hash-2026-secure') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: members, error } = await supabase
      .from('team_members')
      .select('id, pin');

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const results = [];

    for (const member of members) {
      if (!member.pin) {
        results.push({ id: member.id, status: 'no pin - skipped' });
        continue;
      }

      if (member.pin.startsWith('$2')) {
        results.push({ id: member.id, status: 'already hashed - skipped' });
        continue;
      }

      const hashed = await bcrypt.hash(member.pin, 10);

      const { error: updateError } = await supabase
        .from('team_members')
        .update({ pin: hashed })
        .eq('id', member.id);

      if (updateError) {
        results.push({ id: member.id, status: 'ERROR: ' + updateError.message });
      } else {
        results.push({ id: member.id, status: 'hashed OK' });
      }
    }

    return Response.json({
      success: true,
      message: 'PINs hashed. Now update login route and DELETE this file!',
      results
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
