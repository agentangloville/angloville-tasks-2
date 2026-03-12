import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const resend = new Resend(process.env.RESEND_API_KEY);

const TEAM_MEMBERS = [
  { id: 'edyta', name: 'Edyta Kędzior', email: 'e.kedzior@angloville.pl' },
  { id: 'aleksandra', name: 'Aleksandra Witkowska', email: 'a.witkowska@angloville.com' },
  { id: 'damian_l', name: 'Damian Ładak', email: 'd.ladak@angloville.pl' },
  { id: 'damian_w', name: 'Damian Wójcicki', email: 'd.wojcicki@angloville.com' },
  { id: 'wojciech', name: 'Wojciech Pisarski', email: 'w.pisarski@angloville.com' },
  { id: 'klaudia', name: 'Klaudia Gołembiowska', email: 'k.golembiowska@angloville.com' },
];

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

    // Send email notifications to assigned team members
    const assigneeEmails = (task.assignees || [])
      .map(aId => TEAM_MEMBERS.find(m => m.id === aId)?.email)
      .filter(Boolean);

    // Also notify manager
    const managerEmail = 'e.kedzior@angloville.pl';
    if (!assigneeEmails.includes(managerEmail)) {
      assigneeEmails.push(managerEmail);
    }

    if (assigneeEmails.length > 0) {
      try {
        await resend.emails.send({
          from: 'Angloville Tasks <tasks@angloville.pl>',
          to: assigneeEmails,
          subject: `💬 New reply: ${task.title}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa;">
              <div style="max-width: 500px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                
                <div style="background: #232323; padding: 32px; text-align: center;">
                  <img src="https://angloville.com/wp-content/themes/angloville/assets/images/logo.svg" alt="Angloville" style="height: 32px;" />
                  <p style="color: rgba(255,255,255,0.52); margin: 8px 0 0 0; font-size: 12px;">Marketing Tasks</p>
                </div>
                
                <div style="padding: 32px;">
                  <p style="color: #666; margin: 0 0 8px 0; font-size: 14px;">New reply from external requester</p>
                  
                  <h2 style="color: #202124; margin: 0 0 24px 0; font-size: 20px; font-weight: 600;">
                    💬 ${task.submitted_by || 'External'} replied
                  </h2>
                  
                  <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; border-left: 4px solid #1a73e8; margin-bottom: 24px;">
                    <p style="color: #5f6368; margin: 0 0 4px 0; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                      Task
                    </p>
                    <p style="color: #202124; margin: 0 0 16px 0; font-size: 16px; font-weight: 500;">
                      ${task.title}
                    </p>
                    <p style="color: #5f6368; margin: 0 0 4px 0; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                      Message
                    </p>
                    <p style="color: #202124; margin: 0; font-size: 14px; white-space: pre-wrap;">
                      ${text}
                    </p>
                  </div>
                  
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://twoja-app.vercel.app'}" style="display: inline-block; background: #1a73e8; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                    View in App →
                  </a>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px 32px; text-align: center;">
                  <p style="color: #9aa0a6; margin: 0; font-size: 12px;">
                    Angloville Marketing Team
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
      }
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Error adding comment:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
