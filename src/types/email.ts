export interface EmailEvent {
  id: string;
  type: EmailEventType;
  created_at: string;
  data: EmailEventData;
}

export type EmailEventType = 
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.complained'
  | 'email.bounced'
  | 'email.opened'
  | 'email.clicked'
  | 'email.failed';

export interface EmailEventData {
  email_id: string;
  from: string;
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  timestamp: string;
  click?: {
    url: string;
    ip_address?: string;
    user_agent?: string;
  };
  bounce?: {
    type: 'hard' | 'soft';
    reason: string;
  };
  delivery_delayed?: {
    attempt: number;
    next_attempt: string;
    reason: string;
  };
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_at: string;
  updated_at: string;
  template_id?: string;
  automation_rules: AutomationRule[];
  metrics: CampaignMetrics;
}

export interface AutomationRule {
  id: string;
  trigger_event: EmailEventType;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  is_active: boolean;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number;
}

export interface AutomationAction {
  type: 'send_email' | 'update_content' | 'add_tag' | 'remove_tag' | 'wait';
  config: Record<string, any>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject_template: string;
  html_template: string;
  text_template?: string;
  preheader_template?: string;
  variables: TemplateVariable[];
  created_at: string;
  updated_at: string;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required: boolean;
  default_value?: any;
  description?: string;
}

export interface CampaignMetrics {
  total_sent: number;
  delivered: number;
  bounced: number;
  complained: number;
  opened: number;
  clicked: number;
  failed: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  complaint_rate: number;
}

export interface Contact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  tags: string[];
  custom_fields: Record<string, any>;
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained';
  created_at: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  campaign_id?: string;
  template_id?: string;
  contact_id: string;
  email_id: string;
  subject: string;
  status: 'sent' | 'delivered' | 'bounced' | 'complained' | 'opened' | 'clicked' | 'failed';
  sent_at: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  events: EmailEvent[];
} 