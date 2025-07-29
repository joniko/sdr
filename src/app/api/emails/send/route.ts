import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { resendService } from '@/lib/resend-service';

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
      variables = {},
      organization_id = 'default'
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
        // Send single email using improved service
        if (!subject) {
          return NextResponse.json(
            { error: 'Subject is required for single emails' }, 
            { status: 400 }
          );
        }

        const singleResult = await resendService.sendEmail({
          to: Array.isArray(to) ? to[0] : to,
          subject,
          html: html || '',
          text,
          organizationId: organization_id,
          templateName: 'single-email',
          metadata: { campaign_id, variables }
        });

        if (singleResult?.id) {
          await logEmailSent({
            email_id: singleResult.id,
            contact_email: Array.isArray(to) ? to[0] : to,
            subject,
            campaign_id,
            template_id,
            organization_id
          });
        }

        results.push({ success: true, data: singleResult });
        break;

      case 'template':
        // Send email using template with improved service
        if (!template_id) {
          return NextResponse.json(
            { error: 'Template ID is required' }, 
            { status: 400 }
          );
        }

        // Get contact info
        const contactEmail = Array.isArray(to) ? to[0] : to;
        const { data: contact } = await getSupabaseAdmin()
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

        const templateResult = await resendService.sendTemplateEmail({
          templateId: template_id,
          recipient: {
            email: contact.email,
            name: contact.first_name || contact.email,
            contactId: contact.id
          },
          organizationId: organization_id,
          variables
        });

        results.push({ success: true, data: templateResult });
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
        const supabaseAdmin = getSupabaseAdmin();
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

        // Send to each contact using improved service
        for (const contact of contacts) {
          try {
            const campaignResult = await resendService.sendTemplateEmail({
              templateId: campaign.email_templates.name,
              recipient: {
                email: contact.email,
                name: contact.first_name || contact.email,
                contactId: contact.id
              },
              organizationId: organization_id,
              variables: {
                campaign_name: campaign.name,
                ...variables
              }
            });

            results.push({
              contact_id: contact.id,
              email: contact.email,
              result: { success: true, data: campaignResult }
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
  template_id,
  organization_id = 'default'
}: {
  email_id: string;
  contact_email: string;
  subject: string;
  campaign_id?: string;
  template_id?: string;
  organization_id?: string;
}) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
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
          user_id: organization_id
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
          user_id: organization_id
        });
    }
  } catch (error) {
    console.error('Error logging email:', error);
  }
} 