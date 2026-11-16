/**
 * Email sender with priority for Resend over Mailgun.
 * Works seamlessly in both Node.js and Cloudflare Workers (using native fetch).
 */

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    return sendResendEmail(options, resendApiKey);
  }
  return sendMailgunEmail(options);
}

export async function sendResendEmail(options: SendEmailOptions, apiKey: string): Promise<boolean> {
  const defaultFrom = process.env.RESEND_FROM || 'Vision Analytics <noreply@vision.is>';
  
  const recipients = Array.isArray(options.to) ? options.to : [options.to];
  if (recipients.length === 0) return false;

  const payload = {
    from: options.from || defaultFrom,
    to: recipients,
    subject: options.subject,
    html: options.html,
    text: options.text,
  };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[email] Resend API error (${response.status}):`, errorText);
      return false;
    }

    console.log(`[email] Email sent successfully via Resend to ${recipients.join(', ')}`);
    return true;
  } catch (error) {
    console.error('[email] Failed to send email via Resend:', error);
    return false;
  }
}

export async function sendMailgunEmail(options: SendEmailOptions): Promise<boolean> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const defaultFrom = process.env.MAILGUN_FROM || `Vision Analytics <noreply@${domain || 'vision.is'}>`;

  if (!apiKey || !domain) {
    console.warn('[email] Neither Resend nor Mailgun credentials found. Skipping email sending.');
    return false;
  }

  const recipients = Array.isArray(options.to) ? options.to : [options.to];
  if (recipients.length === 0) return false;

  const url = `https://api.mailgun.net/v3/${domain}/messages`;

  const formData = new URLSearchParams();
  formData.append('from', options.from || defaultFrom);
  for (const recipient of recipients) {
    formData.append('to', recipient);
  }
  formData.append('subject', options.subject);
  formData.append('html', options.html);
  if (options.text) {
    formData.append('text', options.text);
  }

  const authHeader = 'Basic ' + btoa(`api:${apiKey}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[email] Mailgun API error (${response.status}):`, errorText);
      return false;
    }

    console.log(`[email] Email sent successfully to ${recipients.join(', ')}`);
    return true;
  } catch (error) {
    console.error('[email] Failed to send email via Mailgun:', error);
    return false;
  }
}
