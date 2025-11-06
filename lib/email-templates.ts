export function getEmailTemplate(templateName: string, data: Record<string, string>): { subject: string; html: string; text: string } {
  const templates: Record<string, (data: Record<string, string>) => { subject: string; html: string; text: string }> = {
    "session-reminder": (d) => ({
      subject: `Reminder: Upcoming Training Session - ${d.dogName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Session Reminder</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Session Reminder</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Hi ${d.clientName},
                      </p>
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        This is a friendly reminder about your upcoming training session with <strong>${d.dogName}</strong>.
                      </p>
                      ${d.sessionDate ? `
                      <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0 0 8px 0; color: #666666; font-size: 14px; font-weight: 600; text-transform: uppercase;">Session Details</p>
                        <p style="margin: 0; color: #333333; font-size: 16px;"><strong>Date & Time:</strong> ${d.sessionDate}</p>
                        <p style="margin: 8px 0 0 0; color: #333333; font-size: 16px;"><strong>Location:</strong> ${d.location}</p>
                      </div>
                      ` : ''}
                      <p style="margin: 20px 0 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        We look forward to seeing you!
                      </p>
                      <p style="margin: 20px 0 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Best regards,<br>
                        <strong>DOYA Training Team</strong>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center;">
                      <p style="margin: 0; color: #666666; font-size: 12px;">
                        © ${new Date().getFullYear()} DOYA Training. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Hi ${d.clientName},\n\nThis is a reminder about your upcoming training session with ${d.dogName}.\n\n${d.sessionDate ? `Date & Time: ${d.sessionDate}\nLocation: ${d.location}\n\n` : ''}We look forward to seeing you!\n\nBest regards,\nDOYA Training Team`,
    }),
    "session-followup": (d) => ({
      subject: `Follow-up: Training Session with ${d.dogName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Session Follow-up</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 40px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px 12px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Session Follow-up</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Hi ${d.clientName},
                      </p>
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Thank you for today's training session with <strong>${d.dogName}</strong>. Here's a brief summary:
                      </p>
                      <div style="background-color: #f8f9fa; border-left: 4px solid #f5576c; padding: 20px; margin: 20px 0; border-radius: 4px;">
                        ${d.sessionNotes ? `<p style="margin: 0; color: #333333; font-size: 16px; white-space: pre-wrap;">${d.sessionNotes}</p>` : '<p style="margin: 0; color: #666666; font-size: 14px; font-style: italic;">No notes added yet.</p>'}
                      </div>
                      <p style="margin: 20px 0 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        If you have any questions or concerns, please don't hesitate to reach out.
                      </p>
                      <p style="margin: 20px 0 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Best regards,<br>
                        <strong>DOYA Training Team</strong>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center;">
                      <p style="margin: 0; color: #666666; font-size: 12px;">
                        © ${new Date().getFullYear()} DOYA Training. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Hi ${d.clientName},\n\nThank you for today's session with ${d.dogName}. Here's a brief summary:\n\n${d.sessionNotes || 'No notes added yet.'}\n\nIf you have any questions, please reach out.\n\nBest regards,\nDOYA Training Team`,
    }),
    "general": (d) => ({
      subject: d.subject || "Message from DOYA Training",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${d.subject || "Message"}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 40px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 12px 12px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${d.subject || "Message"}</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Hi ${d.clientName},
                      </p>
                      <div style="color: #333333; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
                        ${d.message}
                      </div>
                      <p style="margin: 20px 0 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Best regards,<br>
                        <strong>DOYA Training Team</strong>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center;">
                      <p style="margin: 0; color: #666666; font-size: 12px;">
                        © ${new Date().getFullYear()} DOYA Training. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: d.message || "",
    }),
  };

  return templates[templateName]?.(data) || templates["general"](data);
}


