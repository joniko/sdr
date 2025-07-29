import { NextResponse } from 'next/server';

/**
 * GET /api/webhooks
 * 
 * Endpoint de información sobre todos los webhooks disponibles.
 * Útil para documentación y verificación de endpoints.
 */
export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
  
  return NextResponse.json({
    service: 'Email Workflow Intelligence - Webhook Management API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      resend: {
        url: '/api/webhooks/resend',
        methods: ['GET', 'POST'],
        description: 'Webhook endpoint for Resend email service',
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
        features: [
          'Automatic event storage',
          'Contact status updates', 
          'Automation rules processing',
          'Intelligent content adaptation',
          'Real-time analytics'
        ]
      },
      // Future webhook endpoints can be added here
      campaigns: {
        url: '/api/webhooks/campaigns',
        methods: ['POST'],
        description: 'Internal webhook for campaign events',
        organizationRequired: true,
        supportedEvents: [
          'campaign.created',
          'campaign.started',
          'campaign.completed',
          'campaign.paused'
        ],
        status: 'planned'
      },
      automation: {
        url: '/api/webhooks/automation',
        methods: ['POST'], 
        description: 'Internal webhook for automation triggers',
        organizationRequired: true,
        supportedEvents: [
          'automation.triggered',
          'automation.completed',
          'automation.failed'
        ],
        status: 'planned'
      }
    },
    configuration: {
      platform: 'Vercel',
      webhookSecretRequired: true,
      headerNames: {
        resend: 'resend-signature',
        internal: 'x-webhook-secret'
      },
      responseFormat: 'JSON',
      timeout: '30s',
      retryPolicy: {
        maxRetries: 3,
        backoffType: 'exponential'
      }
    },
    examples: {
      resendWebhookUrl: `${baseUrl}/api/webhooks/resend`,
      campaignWebhookUrl: `${baseUrl}/api/webhooks/campaigns`,
      automationWebhookUrl: `${baseUrl}/api/webhooks/automation`
    },
    documentation: {
      setup: `${baseUrl}/docs/webhooks`,
      testing: 'Use GET endpoints for configuration info',
      troubleshooting: 'Check logs in Vercel dashboard'
    },
    status: {
      resend: 'active',
      campaigns: 'planned',
      automation: 'planned'
    }
  });
} 