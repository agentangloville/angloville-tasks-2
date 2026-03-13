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
    // Get the task
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('public_token', token)
      .single();

    if (fetchError || !task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    // Create new comment
    const newComment = {
      id: Math.random().toString(36).substr(2, 9),
      text: text.trim(),
      author: 'external',
      authorName: task.submitted_by || 'External',
      isExternal: true,
      createdAt: new Date().toISOString(),
    };

    // Update task with new comment
    const updatedComments = [...(task.comments || []), newComment];
    
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ comments: updatedComments })
      .eq('id', task.id);

    if (updateError) {
      console.error('Error updating task:', updateError);
      return Response.json({ error: 'Failed to add comment' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Error adding comment:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
