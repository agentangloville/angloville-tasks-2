import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(request, { params }) {
  const { token } = params;

  if (!token) {
    return Response.json({ error: 'Token required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('public_token', token)
      .single();

    if (error || !data) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    // Only return necessary fields for public view
    const publicTask = {
      id: data.id,
      title: data.title,
      description: data.description,
      links: data.links,
      market: data.market,
      status: data.status,
      assignees: data.assignees || [],
      comments: data.comments || [],
      submittedBy: data.submitted_by,
      submitterEmail: data.submitter_email,
      createdAt: data.created_at,
    };

    return Response.json(publicTask);
  } catch (err) {
    console.error('Error fetching task:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
