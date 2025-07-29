import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { EmailEventType } from '@/types/email';
import { processEmailEvent } from '@/lib/automation';

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

    // Store the event in the database
    const { error: dbError } = await supabaseAdmin
      .from('email_events')
      .insert({
        type,
        email_id: data.email_id,
        contact_id: data.to[0], // We'll need to resolve this properly
        data: data,
        user_id: 'system' // We'll need to determine this from the email
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Process automation rules
    await processEmailEvent(type, data);

    // Update email log status
    await updateEmailLogStatus(data.email_id, type);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function updateEmailLogStatus(emailId: string, eventType: EmailEventType) {
  const statusMap: Record<EmailEventType, string> = {
    'email.sent': 'sent',
    'email.delivered': 'delivered',
    'email.delivery_delayed': 'sent',
    'email.complained': 'complained',
    'email.bounced': 'bounced',
    'email.opened': 'opened',
    'email.clicked': 'clicked',
    'email.failed': 'failed'
  };

  const status = statusMap[eventType];
  const updateData: any = { status };

  // Add timestamp for specific events
  if (eventType === 'email.delivered') {
    updateData.delivered_at = new Date().toISOString();
  } else if (eventType === 'email.opened') {
    updateData.opened_at = new Date().toISOString();
  } else if (eventType === 'email.clicked') {
    updateData.clicked_at = new Date().toISOString();
  }

  await supabaseAdmin
    .from('email_logs')
    .update(updateData)
    .eq('email_id', emailId);
} 