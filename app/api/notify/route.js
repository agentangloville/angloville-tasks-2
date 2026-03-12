import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { to, assigneeName, taskTitle, assignedBy } = await request.json();

    if (!to || !taskTitle) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'Angloville Tasks <tasks@angloville.pl>',
      to: [to],
      subject: `📋 Nowe zadanie: ${taskTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #F5F5F5;">
          <div style="max-width: 500px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            
            <!-- Header -->
            <div style="background: #232323; padding: 32px; text-align: center;">
              <img src="https://angloville.com/wp-content/themes/angloville/assets/images/logo.svg" alt="Angloville" style="height: 32px;" />
              <p style="color: rgba(255,255,255,0.52); margin: 8px 0 0 0; font-size: 12px;">Marketing Tasks</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
              <p style="color: #666; margin: 0 0 8px 0; font-size: 14px;">Cześć ${assigneeName || 'tam'}!</p>
              
              <h2 style="color: #232323; margin: 0 0 24px 0; font-size: 20px; font-weight: 600;">
                Masz nowe zadanie do wykonania
              </h2>
              
              <!-- Task Card -->
              <div style="background: #F5F5F5; border-radius: 12px; padding: 20px; border-left: 4px solid #428BCA;">
                <p style="color: #428BCA; margin: 0 0 4px 0; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                  Zadanie
                </p>
                <p style="color: #232323; margin: 0; font-size: 16px; font-weight: 500;">
                  ${taskTitle}
                </p>
              </div>
              
              <p style="color: #666; margin: 24px 0; font-size: 14px;">
                Przypisane przez: <strong style="color: #232323;">${assignedBy || 'Manager'}</strong>
              </p>
              
              <!-- CTA Button -->
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://twoja-app.vercel.app'}" style="display: inline-block; background: #FCD23A; color: #232323; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                Otwórz aplikację →
              </a>
            </div>
            
            <!-- Footer -->
            <div style="background: #F5F5F5; padding: 20px 32px; text-align: center;">
              <p style="color: #999; margin: 0; font-size: 12px;">
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
