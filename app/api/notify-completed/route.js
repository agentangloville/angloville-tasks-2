import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { to, requesterName, taskTitle, completedBy, publicToken, message } = await request.json();

    if (!to || !taskTitle) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const trackingUrl = publicToken 
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://twoja-app.vercel.app'}/task/${publicToken}`
      : null;

    const { data, error } = await resend.emails.send({
      from: 'Angloville Tasks <tasks@angloville.pl>',
      to: [to],
      subject: `✅ Completed: ${taskTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa;">
          <div style="max-width: 500px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            
            <div style="background: #34a853; padding: 32px; text-align: center;">
              <div style="width: 64px; height: 64px; background: white; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">✅</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Task Completed!</h1>
            </div>
            
            <div style="padding: 32px;">
              <p style="color: #5f6368; margin: 0 0 8px 0; font-size: 14px;">Hi ${requesterName || 'there'}!</p>
              
              <p style="color: #202124; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                Great news! Your request has been completed by the marketing team.
              </p>
              
              <div style="background: #e6f4ea; border-radius: 12px; padding: 20px; border-left: 4px solid #34a853; margin-bottom: 24px;">
                <p style="color: #137333; margin: 0 0 4px 0; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                  Completed Request
                </p>
                <p style="color: #202124; margin: 0; font-size: 18px; font-weight: 500;">
                  ${taskTitle}
                </p>
              </div>
              
              ${message ? `
              <div style="background: #f8f9fa; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="color: #5f6368; margin: 0 0 8px 0; font-size: 12px; font-weight: 600;">Message from the team:</p>
                <p style="color: #202124; margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
              </div>
              ` : ''}
              
              <p style="color: #5f6368; margin: 0 0 24px 0; font-size: 14px;">
                Completed by: <strong style="color: #202124;">${completedBy || 'Marketing Team'}</strong>
              </p>
              
              ${trackingUrl ? `
              <a href="${trackingUrl}" style="display: inline-block; background: #1a73e8; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                View Details →
              </a>
              ` : ''}
              
              <p style="color: #9aa0a6; margin: 24px 0 0 0; font-size: 12px;">
                Thank you for using Angloville Marketing Tasks!
              </p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px 32px; text-align: center;">
              <img src="https://angloville.com/wp-content/themes/angloville/assets/images/logo.svg" alt="Angloville" style="height: 24px; opacity: 0.5;" />
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return Response.json({ error: error.message, sent: false }, { status: 500 });
    }

    return Response.json({ success: true, sent: true, messageId: data.id });
  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: 'Internal server error', sent: false }, { status: 500 });
  }
}
