export interface Database {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status: 'draft' | 'active' | 'paused' | 'completed';
          created_at: string;
          updated_at: string;
          template_id: string | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          status?: 'draft' | 'active' | 'paused' | 'completed';
          created_at?: string;
          updated_at?: string;
          template_id?: string | null;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          status?: 'draft' | 'active' | 'paused' | 'completed';
          created_at?: string;
          updated_at?: string;
          template_id?: string | null;
          user_id?: string;
        };
      };
      email_templates: {
        Row: {
          id: string;
          name: string;
          subject_template: string;
          html_template: string;
          text_template: string | null;
          preheader_template: string | null;
          variables: any;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          subject_template: string;
          html_template: string;
          text_template?: string | null;
          preheader_template?: string | null;
          variables?: any;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          subject_template?: string;
          html_template?: string;
          text_template?: string | null;
          preheader_template?: string | null;
          variables?: any;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          tags: string[];
          custom_fields: any;
          status: 'active' | 'unsubscribed' | 'bounced' | 'complained';
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          tags?: string[];
          custom_fields?: any;
          status?: 'active' | 'unsubscribed' | 'bounced' | 'complained';
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          tags?: string[];
          custom_fields?: any;
          status?: 'active' | 'unsubscribed' | 'bounced' | 'complained';
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      email_events: {
        Row: {
          id: string;
          type: string;
          email_id: string;
          contact_id: string;
          campaign_id: string | null;
          data: any;
          created_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          type: string;
          email_id: string;
          contact_id: string;
          campaign_id?: string | null;
          data?: any;
          created_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          type?: string;
          email_id?: string;
          contact_id?: string;
          campaign_id?: string | null;
          data?: any;
          created_at?: string;
          user_id?: string;
        };
      };
      email_logs: {
        Row: {
          id: string;
          campaign_id: string | null;
          template_id: string | null;
          contact_id: string;
          email_id: string;
          subject: string;
          status: string;
          sent_at: string;
          delivered_at: string | null;
          opened_at: string | null;
          clicked_at: string | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          campaign_id?: string | null;
          template_id?: string | null;
          contact_id: string;
          email_id: string;
          subject: string;
          status: string;
          sent_at?: string;
          delivered_at?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          user_id: string;
        };
        Update: {
          id?: string;
          campaign_id?: string | null;
          template_id?: string | null;
          contact_id?: string;
          email_id?: string;
          subject?: string;
          status?: string;
          sent_at?: string;
          delivered_at?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          user_id?: string;
        };
      };
      automation_rules: {
        Row: {
          id: string;
          campaign_id: string;
          trigger_event: string;
          conditions: any;
          actions: any;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          trigger_event: string;
          conditions?: any;
          actions?: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          trigger_event?: string;
          conditions?: any;
          actions?: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
} 