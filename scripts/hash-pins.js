const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // service key, NIE anon key!
);

async function hashAllPins() {
  const { data: members } = await supabase
    .from('team_members')
    .select('id, pin');

  for (const member of members) {
    if (!member.pin || member.pin.startsWith('$2')) continue; // już zahashowany

    const hashed = await bcrypt.hash(member.pin, 10);
    await supabase
      .from('team_members')
      .update({ pin: hashed })
      .eq('id', member.id);

    console.log(`✅ Zahashowano PIN dla: ${member.id}`);
  }
  console.log('Gotowe!');
}

hashAllPins();
