import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendTemplatedEmail, sendEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      type, // 'single' | 'template' | 'campaign'
      to,
      subject,
      html,
      text,
      template_id,
      campaign_id,
      contact_ids,
      variables = {}
    } = body;

    // Validate request
    if (!type || !to) {
      return NextResponse.json(
        { error: 'Type and recipient(s) are required' }, 
        { status: 400 }
      );
    }

    let results = [];

    switch (type) {
      case 'single':
        // Send single email
        if (!subject) {
          return NextResponse.json(
            { error: 'Subject is required for single emails' }, 
            { status: 400 }
          );
        }

        const singleResult = await sendEmail({
          to,
          from: process.env.FROM_EMAIL || 'noreply@example.com',
          subject,
          html,
          text
        });

        if (singleResult.success && singleResult.data) {
          // Log to database
          await logEmailSent({
            email_id: singleResult.data.data?.id || 'unknown',
            contact_email: Array.isArray(to) ? to[0] : to,
            subject,
            campaign_id: campaign_id || null,
            template_id: template_id || null
          });
        }

        results.push(singleResult);
        break;

      case 'template':
        // Send email using template
        if (!template_id) {
          return NextResponse.json(
            { error: 'Template ID is required' }, 
            { status: 400 }
          );
        }

        const { data: template } = await supabaseAdmin
          .from('email_templates')
          .select('*')
          .eq('id', template_id)
          .single();

        if (!template) {
          return NextResponse.json(
            { error: 'Template not found' }, 
            { status: 404 }
          );
        }

        // Get contact info
        const contactEmail = Array.isArray(to) ? to[0] : to;
        const { data: contact } = await supabaseAdmin
          .from('contacts')
          .select('*')
          .eq('email', contactEmail)
          .single();

        if (!contact) {
          return NextResponse.json(
            { error: 'Contact not found' }, 
            { status: 404 }
          );
        }

        const templateResult = await sendTemplatedEmail(template, contact, variables);
        
        if (templateResult.success && templateResult.data) {
          await logEmailSent({
            email_id: templateResult.data.data?.id || 'unknown',
            contact_email: contact.email,
            subject: template.subject_template,
            campaign_id,
            template_id
          });
        }

        results.push(templateResult);
        break;

      case 'campaign':
        // Send campaign to multiple contacts
        if (!campaign_id || !contact_ids || contact_ids.length === 0) {
          return NextResponse.json(
            { error: 'Campaign ID and contact IDs are required' }, 
            { status: 400 }
          );
        }

        // Get campaign and template
        const { data: campaign } = await supabaseAdmin
          .from('campaigns')
          .select(`
            *,
            email_templates (*)
          `)
          .eq('id', campaign_id)
          .single();

        if (!campaign || !campaign.email_templates) {
          return NextResponse.json(
            { error: 'Campaign or template not found' }, 
            { status: 404 }
          );
        }

        // Get contacts
        const { data: contacts } = await supabaseAdmin
          .from('contacts')
          .select('*')
          .in('id', contact_ids)
          .eq('status', 'active');

        if (!contacts || contacts.length === 0) {
          return NextResponse.json(
            { error: 'No active contacts found' }, 
            { status: 404 }
          );
        }

        // Send to each contact
        for (const contact of contacts) {
          try {
            const campaignResult = await sendTemplatedEmail(
              campaign.email_templates, 
              contact, 
              variables
            );
            
            if (campaignResult.success && campaignResult.data) {
              await logEmailSent({
                email_id: campaignResult.data.data?.id || 'unknown',
                contact_email: contact.email,
                subject: campaign.email_templates.subject_template,
                campaign_id,
                template_id: campaign.template_id
              });
            }

            results.push({
              contact_id: contact.id,
              email: contact.email,
              result: campaignResult
            });
          } catch (error) {
            console.error(`Error sending to ${contact.email}:`, error);
            results.push({
              contact_id: contact.id,
              email: contact.email,
              result: { success: false, error: String(error) }
            });
          }
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type' }, 
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true, 
      results,
      total_sent: results.filter(r => {
        if ('success' in r) return r.success;
        if ('result' in r) return r.result?.success;
        return false;
      }).length
    });

  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

async function logEmailSent({
  email_id,
  contact_email,
  subject,
  campaign_id,
  template_id
}: {
  email_id: string;
  contact_email: string;
  subject: string;
  campaign_id?: string | null;
  template_id?: string | null;
}) {
  try {
    // Get or create contact
    let { data: contact } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .eq('email', contact_email)
      .single();

    if (!contact) {
      const { data: newContact } = await supabaseAdmin
        .from('contacts')
        .insert({
          email: contact_email,
          status: 'active',
          user_id: 'current_user'
        })
        .select('id')
        .single();
      
      contact = newContact;
    }

    if (contact) {
      // Log the email
      await supabaseAdmin
        .from('email_logs')
        .insert({
          campaign_id,
          template_id,
          contact_id: contact.id,
          email_id,
          subject,
          status: 'sent',
          user_id: 'current_user'
        });
    }
  } catch (error) {
    console.error('Error logging email:', error);
  }
} 