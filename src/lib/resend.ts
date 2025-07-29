import { Resend } from 'resend';
import { EmailTemplate, Contact } from '@/types/email';

// Lazy initialization to avoid build-time errors
export const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Missing Resend API key');
  }
  return new Resend(apiKey);
};

export interface SendEmailOptions {
  to: string | string[];
  from: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
}

export const sendEmail = async (options: SendEmailOptions) => {
  try {
    const emailOptions: any = {
      from: options.from,
      to: options.to,
      subject: options.subject,
    };

    if (options.html) emailOptions.html = options.html;
    if (options.text) emailOptions.text = options.text;
    if (options.replyTo) emailOptions.replyTo = options.replyTo;
    if (options.headers) emailOptions.headers = options.headers;
    if (options.tags) emailOptions.tags = options.tags;

    const resend = getResend();
    const data = await resend.emails.send(emailOptions);

    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

export const sendTemplatedEmail = async (
  template: EmailTemplate,
  contact: Contact,
  variables: Record<string, any> = {}
) => {
  // Replace template variables
  const processedSubject = processTemplate(template.subject_template, { ...contact, ...variables });
  const processedHtml = processTemplate(template.html_template, { ...contact, ...variables });
  const processedText = template.text_template ? 
    processTemplate(template.text_template, { ...contact, ...variables }) : undefined;

  return sendEmail({
    to: contact.email,
    from: process.env.FROM_EMAIL || 'noreply@example.com',
    subject: processedSubject,
    html: processedHtml,
    text: processedText,
    tags: [
      { name: 'template', value: template.id },
      { name: 'contact', value: contact.id }
    ]
  });
};

// Simple template processing function
const processTemplate = (template: string, variables: Record<string, any>): string => {
  let processed = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    processed = processed.replace(regex, String(value || ''));
  });
  
  return processed;
};

export const createWebhookEndpoint = async (url: string, events: string[]) => {
  try {
    // Note: Resend webhook creation would be done via their dashboard
    // This is a placeholder for the webhook configuration
    console.log('Webhook should be configured at:', url);
    console.log('Events to listen for:', events);
    
    return { success: true, webhookUrl: url };
  } catch (error) {
    console.error('Error creating webhook:', error);
    return { success: false, error };
  }
}; 