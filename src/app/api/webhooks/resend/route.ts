import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { EmailEventType } from '@/types/email';
import { resendService } from '@/lib/resend-service';

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
    // This now handles event storage, contact updates, and automation triggers
    await resendService.processWebhook({ type, data });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

 