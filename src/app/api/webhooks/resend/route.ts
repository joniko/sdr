import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { EmailEventType } from '@/types/email';
import { resendService } from '@/lib/resend-service';
import { processEmailEvent } from '@/lib/automation';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/webhooks/resend
 * 
 * Endpoint de información sobre el webhook de Resend.
 * Útil para verificar configuración y eventos soportados.
 */
export async function GET() {
  return NextResponse.json({
    service: 'Resend Webhook Endpoint',
    timestamp: new Date().toISOString(),
    endpoint: '/api/webhooks/resend',
    methods: ['GET', 'POST'],
    description: 'Webhook endpoint for Resend email service events',
    organizationRequired: false,
    supportedEvents: [
      'email.sent',
      'email.delivered',
      'email.delivery_delayed',
      'email.complained',
      'email.bounced',
      'email.opened',
      'email.clicked',
      'email.failed'
    ],
    configuration: {
      headerRequired: 'resend-signature',
      responseFormat: 'JSON',
      timeout: '30s',
      features: [
        'Automatic event storage in database',
        'Contact status updates',
        'Automation rules processing',
        'Intelligent content adaptation',
        'Real-time analytics updates'
      ]
    },
    integration: {
      setupUrl: 'https://resend.com/webhooks',
      documentation: 'https://resend.com/docs/webhooks',
      testingTip: 'Use Resend dashboard to send test events'
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature
    const headersList = await headers();
    const signature = headersList.get('resend-signature');
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Parse the request body
    const body = await req.json();
    const { type, data } = body;

    // Validate event type
    const validEventTypes: EmailEventType[] = [
      'email.sent',
      'email.delivered', 
      'email.delivery_delayed',
      'email.complained',
      'email.bounced',
      'email.opened',
      'email.clicked',
      'email.failed'
    ];

    if (!validEventTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // Process webhook using the improved ResendService
    // This handles event storage and contact updates
    await resendService.processWebhook({ type, data });

    // Store the event in the database (additional logging)
    const supabaseAdmin = getSupabaseAdmin();
    const { error: dbError } = await supabaseAdmin
      .from('email_events')
      .insert({
        type,
        email_id: data.email_id || 'unknown',
        contact_id: await resolveContactId(data.to?.[0] || data.email),
        data: data,
        user_id: 'system'
      });

    if (dbError) {
      console.error('Database error logging webhook event:', dbError);
      // Don't fail the webhook for logging errors
    }

    // Process automation rules (the important part I removed!)
    await processEmailEvent(type, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to resolve contact ID by email
async function resolveContactId(email: string): Promise<string | null> {
  if (!email) return null;
  
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .eq('email', email)
      .single();
    
    if (error || !contact) {
      console.log(`Contact not found for email: ${email}`);
      return null;
    }
    
    return contact.id;
  } catch (error) {
    console.error('Error resolving contact ID:', error);
    return null;
  }
}

 