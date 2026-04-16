import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'create') {
      if (!data.pin || !data.name || !data.email) {
        return Response.json({ error: 'Missing fields' }, { status: 400 });
      }

      const hashedPin = await bcrypt.hash(data.pin, 10);

      const { data: result, error } = await supabase
        .from('team_members')
        .insert([{
          id: data.id,
          name: data.name,
          email: data.email,
          pin: hashedPin,
          color: data.color || '#3b82f6',
          role: data.role || 'Member',
          is_manager: data.isManager || false,
          language: data.language || 'pl',
          restricted_to_market: data.restrictedToMarket || null,
          see_only_assigned: data.seeOnlyAssigned || false,
          default_tasks_view: data.defaultTasksView || (data.seeOnlyAssigned ? 'mine' : 'all'),
          default_sends_view: data.defaultSendsView || 'all',
          is_active: true,
        }])
        .select('id, name, email, color, role, is_manager, language, restricted_to_market, see_only_assigned, default_tasks_view, default_sends_view, is_active')
        .single();

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ success: true, user: result });
    }

    if (action === 'update') {
      const updates = {};
      if (data.name !== undefined) updates.name = data.name;
      if (data.email !== undefined) updates.email = data.email;
      if (data.color !== undefined) updates.color = data.color;
      if (data.role !== undefined) updates.role = data.role;
      if (data.isManager !== undefined) updates.is_manager = data.isManager;
      if (data.language !== undefined) updates.language = data.language;
      if (data.restrictedToMarket !== undefined) updates.restricted_to_market = data.restrictedToMarket;
      if (data.seeOnlyAssigned !== undefined) updates.see_only_assigned = data.seeOnlyAssigned;
      if (data.defaultTasksView !== undefined) updates.default_tasks_view = data.defaultTasksView;
      if (data.defaultSendsView !== undefined) updates.default_sends_view = data.defaultSendsView;
      if (data.isActive !== undefined) updates.is_active = data.isActive;

      if (data.pin) {
        updates.pin = await bcrypt.hash(data.pin, 10);
      }

      const { error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('id', data.id);

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Users API error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
