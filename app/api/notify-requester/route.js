import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { to, requesterName, taskTitle, commentText, commenterName, publicToken } = await request.json();

    if (!to || !taskTitle || !commentText || !publicToken) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://twoja-app.vercel.app'}/task/${publicToken}`;

    const { data, error } = await resend.emails.send({
      from: 'Angloville Tasks <tasks@angloville.pl>',
      to: [to],
      subject: `💬 Update on your request: ${taskTitle}`,
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
              <p style="color: #666; margin: 0 0 8px 0; font-size: 14px;">Hi ${requesterName || 'there'}!</p>
              
              <h2 style="color: #202124; margin: 0 0 24px 0; font-size: 20px; font-weight: 600;">
                💬 New message on your request
              </h2>
              
              <div style="background: #f8f9fa; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                <p style="color: #5f6368; margin: 0 0 4px 0; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                  Request
                </p>
                <p style="color: #202124; margin: 0; font-size: 15px; font-weight: 500;">
                  ${taskTitle}
                </p>
              </div>
              
              <div style="background: #e8f0fe; border-radius: 12px; padding: 20px; border-left: 4px solid #1a73e8; margin-bottom: 24px;">
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; font-size: 14px; font-weight: 600; color: #202124;">${commenterName || 'Team'}</p>
                  <p style="margin: 0; font-size: 11px; color: #5f6368;">Angloville Marketing</p>
                </div>
                <p style="color: #202124; margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
                  ${commentText}
                </p>
              </div>
              
              <p style="color: #5f6368; margin: 0 0 24px 0; font-size: 14px;">
                Click below to view the full conversation and reply:
              </p>
              
              <a href="${trackingUrl}" style="display: inline-block; background: #1a73e8; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                View & Reply →
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

    if (error) {
      console.error('Resend error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, messageId: data.id });
  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
