import { supabaseAdmin } from '@/lib/supabase';
import { sendTemplatedEmail } from '@/lib/resend';
import { EmailEventType, AutomationRule, AutomationCondition, AutomationAction } from '@/types/email';

export async function processEmailEvent(eventType: EmailEventType, eventData: any) {
  try {
    // Find all active automation rules for this event type
    const { data: rules, error } = await supabaseAdmin
      .from('automation_rules')
      .select('*')
      .eq('trigger_event', eventType)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching automation rules:', error);
      return;
    }

    // Process each rule
    for (const rule of rules || []) {
      if (await evaluateConditions(rule.conditions, eventData)) {
        await executeActions(rule.actions, eventData, rule.campaign_id);
      }
    }
  } catch (error) {
    console.error('Error processing email event:', error);
  }
}

async function evaluateConditions(conditions: AutomationCondition[], eventData: any): Promise<boolean> {
  if (!conditions || conditions.length === 0) {
    return true; // No conditions means always trigger
  }

  for (const condition of conditions) {
    const fieldValue = getNestedValue(eventData, condition.field);
    
    if (!evaluateCondition(fieldValue, condition.operator, condition.value)) {
      return false; // All conditions must be true (AND logic)
    }
  }

  return true;
}

function evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
  switch (operator) {
    case 'equals':
      return fieldValue === expectedValue;
    case 'not_equals':
      return fieldValue !== expectedValue;
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(expectedValue).toLowerCase());
    case 'greater_than':
      return Number(fieldValue) > Number(expectedValue);
    case 'less_than':
      return Number(fieldValue) < Number(expectedValue);
    default:
      return false;
  }
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

async function executeActions(actions: AutomationAction[], eventData: any, campaignId: string) {
  for (const action of actions) {
    try {
      switch (action.type) {
        case 'send_email':
          await executeSendEmailAction(action.config, eventData, campaignId);
          break;
        case 'update_content':
          await executeUpdateContentAction(action.config, eventData, campaignId);
          break;
        case 'add_tag':
          await executeAddTagAction(action.config, eventData);
          break;
        case 'remove_tag':
          await executeRemoveTagAction(action.config, eventData);
          break;
        case 'wait':
          await executeWaitAction(action.config);
          break;
        default:
          console.warn('Unknown action type:', action.type);
      }
    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error);
    }
  }
}

async function executeSendEmailAction(config: any, eventData: any, campaignId: string) {
  const { template_id, delay_hours = 0 } = config;

  if (delay_hours > 0) {
    // Schedule for later (you might want to use a queue system for this)
    setTimeout(async () => {
      await sendFollowUpEmail(template_id, eventData, campaignId);
    }, delay_hours * 60 * 60 * 1000);
  } else {
    await sendFollowUpEmail(template_id, eventData, campaignId);
  }
}

async function sendFollowUpEmail(templateId: string, eventData: any, campaignId: string) {
  // Get template
  const { data: template } = await supabaseAdmin
    .from('email_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (!template) {
    console.error('Template not found:', templateId);
    return;
  }

  // Get contact info
  const contactEmail = eventData.to[0];
  const { data: contact } = await supabaseAdmin
    .from('contacts')
    .select('*')
    .eq('email', contactEmail)
    .single();

  if (!contact) {
    console.error('Contact not found:', contactEmail);
    return;
  }

  // Send email with intelligent content adaptation
  const adaptedContent = await adaptContentBasedOnEvent(template, eventData);
  
  await sendTemplatedEmail(adaptedContent, contact, {
    original_subject: eventData.subject,
    event_type: eventData.type,
    campaign_id: campaignId
  });
}

async function adaptContentBasedOnEvent(template: any, eventData: any) {
  // This is where the intelligent content adaptation happens
  // Based on the event type, we modify the content
  
  let adaptedTemplate = { ...template };

  switch (eventData.type) {
    case 'email.opened':
      // If someone opened but didn't click, send a follow-up with more compelling CTA
      adaptedTemplate.subject_template = `🔥 Still interested? ${template.subject_template}`;
      adaptedTemplate.html_template = enhanceCallToAction(template.html_template);
      break;
      
    case 'email.clicked':
      // If someone clicked, send thank you or related content
      adaptedTemplate.subject_template = `Thanks for your interest! Next steps inside`;
      adaptedTemplate.html_template = addThankYouMessage(template.html_template);
      break;
      
    case 'email.bounced':
      // Create alternative contact method or re-engagement content
      adaptedTemplate.subject_template = `Alternative ways to connect`;
      break;
      
    case 'email.complained':
      // Send apology and unsubscribe confirmation
      adaptedTemplate.subject_template = `We're sorry - you've been unsubscribed`;
      adaptedTemplate.html_template = createApologyMessage();
      break;
      
    default:
      // Keep original template
      break;
  }

  return adaptedTemplate;
}

function enhanceCallToAction(htmlTemplate: string): string {
  // Add urgency and scarcity to CTAs
  return htmlTemplate
    .replace(/Click here/gi, '👆 Click now - Limited time offer')
    .replace(/Learn more/gi, '🚀 Get instant access')
    .replace(/href="([^"]*)"([^>]*>)([^<]*)</gi, 'href="$1"$2🔥 $3 - Don\'t miss out!<');
}

function addThankYouMessage(htmlTemplate: string): string {
  const thankYouMessage = `
    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #0369a1;">Thank you for your interest! 🙏</h3>
      <p>We noticed you clicked on our previous email. Here's what happens next:</p>
    </div>
  `;
  
  return htmlTemplate.replace(/<body[^>]*>/i, `$&${thankYouMessage}`);
}

function createApologyMessage(): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 40px;">
          <h2 style="color: #dc2626;">We're truly sorry</h2>
          <p>We understand that our email wasn't what you were looking for.</p>
          <p>You have been successfully unsubscribed from our mailing list.</p>
          <p style="color: #6b7280; font-size: 14px;">
            If this was a mistake, you can resubscribe at any time on our website.
          </p>
        </div>
      </body>
    </html>
  `;
}

async function executeUpdateContentAction(config: any, eventData: any, campaignId: string) {
  // Update campaign content based on performance metrics
  const { field, new_value } = config;
  
  await supabaseAdmin
    .from('campaigns')
    .update({ [field]: new_value })
    .eq('id', campaignId);
}

async function executeAddTagAction(config: any, eventData: any) {
  const { tag } = config;
  const contactEmail = eventData.to[0];
  
  const { data: contact } = await supabaseAdmin
    .from('contacts')
    .select('tags')
    .eq('email', contactEmail)
    .single();

  if (contact) {
    const currentTags = contact.tags || [];
    if (!currentTags.includes(tag)) {
      await supabaseAdmin
        .from('contacts')
        .update({ tags: [...currentTags, tag] })
        .eq('email', contactEmail);
    }
  }
}

async function executeRemoveTagAction(config: any, eventData: any) {
  const { tag } = config;
  const contactEmail = eventData.to[0];
  
  const { data: contact } = await supabaseAdmin
    .from('contacts')
    .select('tags')
    .eq('email', contactEmail)
    .single();

  if (contact) {
    const currentTags = contact.tags || [];
    await supabaseAdmin
      .from('contacts')
      .update({ tags: currentTags.filter((t: string) => t !== tag) })
      .eq('email', contactEmail);
  }
}

async function executeWaitAction(config: any) {
  const { duration_hours = 1 } = config;
  // In a real implementation, you'd use a queue system
  // For now, this is just a placeholder
  console.log(`Waiting ${duration_hours} hours before next action`);
} 