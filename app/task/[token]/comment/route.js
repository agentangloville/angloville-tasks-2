import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request, { params }) {
  const { token } = params;
  const { text } = await request.json();

  if (!token || !text) {
    return Response.json({ error: 'Token and text required' }, { status: 400 });
  }

  try {
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('id, submitted_by')
      .eq('public_token', token)
      .single();

    if (fetchError || !task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    const newComment = {
      id: Math.random().toString(36).substr(2, 9),
      text: text.trim(),
      author: 'external',
      authorName: task.submitted_by || 'External',
      isExternal: true,
      createdAt: new Date().toISOString(),
    };

    // Atomowy append po stronie Postgresa zamiast read-modify-write,
    // inaczej komentarz zewnętrzny może skasować komentarz zespołu
    // dodany w tej samej chwili (i odwrotnie).
    const { error: rpcError } = await supabase.rpc('append_task_comment', {
      p_task_id: task.id,
      p_comment: newComment,
    });

    if (rpcError) {
      console.error('Error appending comment:', rpcError);
      return Response.json({ error: 'Failed to add comment' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Error adding comment:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
