import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for server-side
);

export async function POST(request) {
  try {
    const { userId, pin } = await request.json();

    if (!userId || !pin) {
      return Response.json({ error: 'Missing credentials' }, { status: 400 });
    }

    // Verify PIN server-side
    const { data, error } = await supabase
      .from('team_members')
      .select('id, name, email, color, role, is_manager, language, restricted_to_market, see_only_assigned, is_active, pin')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return Response.json({ error: 'User not found' }, { status: 401 });
    }

    // Check PIN
    if (data.pin !== pin) {
      return Response.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    // Return user data WITHOUT pin
    return Response.json({
      success: true,
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        color: data.color,
        role: data.role,
        isManager: data.is_manager,
        language: data.language,
        restrictedToMarket: data.restricted_to_market,
        seeOnlyAssigned: data.see_only_assigned,
        isActive: data.is_active,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
