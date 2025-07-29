import { Resend } from 'resend';
import { EmailTemplate, Contact } from '@/types/email';
import { getSupabaseAdmin } from '@/lib/supabase';

// === INTERFACES ===
export interface EmailSendOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  organizationId?: string;
  templateName?: string;
  metadata?: any;
  headers?: Record<string, string>;
}

export interface TemplateEmailOptions {
  templateId: string;
  recipient: {
    email: string;
    name: string;
    contactId?: string;
  };
  organizationId?: string;
  variables?: Record<string, any>;
}

export interface ResendTemplate {
  subject: string;
  html: string;
  textFallback?: string;
}

export class ResendService {
  private resend!: Resend;
  private config: any;

  constructor() {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (RESEND_API_KEY) {
      this.resend = new Resend(RESEND_API_KEY);
    }
  }

  /**
   * Configura el servicio con las API keys específicas de la organización
   */
  configure(config: { apiKey: string; webhookSecret?: string }): void {
    this.config = config;
    this.resend = new Resend(config.apiKey);
  }

  /**
   * Procesa webhooks de Resend
   */
  async processWebhook(data: any): Promise<void> {
    console.log('Processing Resend webhook', data);
    
    try {
      const { type, data: eventData } = data;
      
      switch (type) {
        case 'email.delivered':
          await this.handleEmailDelivered(eventData);
          break;
        case 'email.bounced':
          await this.handleEmailBounced(eventData);
          break;
        case 'email.opened':
          await this.handleEmailOpened(eventData);
          break;
        case 'email.clicked':
          await this.handleEmailClicked(eventData);
          break;
        case 'email.complained':
          await this.handleEmailComplained(eventData);
          break;
        case 'email.failed':
          await this.handleEmailFailed(eventData);
          break;
        default:
          console.log(`Unhandled Resend webhook event: ${type}`);
      }
    } catch (error) {
      console.error('Error processing Resend webhook', { error });
      throw error;
    }
  }

  /**
   * Envía un email individual
   */
  async sendEmail(config: EmailSendOptions): Promise<any> {
    try {
      let { to, subject, html, text, organizationId = 'default', templateName = 'unknown', metadata, headers = {} } = config;

      // Validar formato de email
      if (!this.isValidEmail(to)) {
        throw new Error(`Invalid email format: ${to}`);
      }

      // Detectar entorno de desarrollo
      const isDevelopment = process.env.NODE_ENV !== 'production';
      const isTestEmail = to.includes('example.com') || to.includes('test.') || to.includes('@localhost');
      
      // Redireccionar emails en desarrollo
      if (isDevelopment || isTestEmail) {
        const reason = isDevelopment ? "Development mode" : "Test email detected";
        console.log(`${reason}: Redirecting email`, { 
          originalTo: to, 
          redirectTo: process.env.DEV_EMAIL_REDIRECT || "test@example.com",
          isDevelopment,
          isTestEmail 
        });
        to = process.env.DEV_EMAIL_REDIRECT || "test@example.com";
      }

      // Configurar remitente por organización
      const from = process.env.FROM_EMAIL || "Email Workflow <noreply@example.com>";

      // Headers personalizados
      const customHeaders = {
        "X-Template-Name": templateName,
        "X-Entity-Ref-ID": crypto.randomUUID(),
        "X-Organization-ID": organizationId,
        ...headers
      };

      const emailData = {
        from,
        to: [to],
        subject,
        html,
        text,
        headers: customHeaders,
        tags: [
          { name: 'template', value: templateName },
          { name: 'organization', value: organizationId }
        ]
      };

      const response = await this.resend.emails.send(emailData);

      // Registrar la petición en la base de datos
      await this.saveIntegrationRequest({
        organizationId,
        method: 'POST',
        endpoint: '/emails/send',
        body: emailData,
        status: response.error ? 400 : 200,
        response: JSON.stringify(response.data || response.error)
      });

      if (response.error || !response.data?.id) {
        throw new Error(response.error?.message || "Error al enviar email");
      }

      console.log(`Email sent successfully: ${response.data.id}`, { to, subject, templateName });
      return response.data;

    } catch (error) {
      await this.saveIntegrationRequest({
        organizationId: config.organizationId || 'default',
        method: 'POST',
        endpoint: '/emails/send',
        body: config,
        status: 500,
        response: JSON.stringify({ error: (error as Error).message })
      });

      console.error(`Error sending email to: ${config.to}, template: ${config.templateName}`, error);
      throw error;
    }
  }

  /**
   * Envía email usando template
   */
  async sendTemplateEmail(config: TemplateEmailOptions): Promise<any> {
    try {
      const { templateId, recipient, organizationId = 'default', variables = {} } = config;
      
      // Intentar obtener template con branding de organización
      let template = await this.getTemplateWithBranding(templateId, organizationId, {
        nombre: recipient.name,
        email: recipient.email,
        ...variables
      });

      // Fallback a templates básicos
      if (!template) {
        template = this.getTemplate(templateId, {
          nombre: recipient.name,
          email: recipient.email,
          ...variables
        });
      }

      if (!template) {
        throw new Error(`Template ${templateId} no encontrado`);
      }

      return await this.sendEmail({
        to: recipient.email,
        subject: template.subject,
        html: template.html,
        text: template.textFallback,
        organizationId,
        templateName: templateId,
        metadata: { contactId: recipient.contactId, variables }
      });

    } catch (error) {
      console.error(`Error sending template email - templateId: ${config.templateId}, email: ${config.recipient.email}`, error);
      throw error;
    }
  }

  /**
   * Obtiene template con manejo de errores y type safety
   */
  private getTemplate(templateId: string, variables: Record<string, any>): ResendTemplate | null {
    const templates = this.getTemplateDefinitions();
    const template = templates[templateId];
    
    if (!template) {
      console.error("Template not found", { templateId, availableTemplates: Object.keys(templates) });
      return null;
    }

    // Interpolación de variables
    const interpolatedSubject = this.interpolateVariables(template.subject, variables);
    const interpolatedHtml = this.interpolateVariables(template.html, variables);

    return {
      subject: interpolatedSubject,
      html: interpolatedHtml,
      textFallback: template.textFallback
    };
  }

  /**
   * Obtiene template con header y footer de la organización
   */
  async getTemplateWithBranding(templateId: string, organizationId: string, variables: Record<string, any>): Promise<ResendTemplate | null> {
    try {
      // Obtener templates de organización
      const orgTemplates = await this.getOrganizationTemplates(organizationId);
      const template = orgTemplates[templateId];
      
      if (!template) {
        console.log("Organization template not found", { templateId, organizationId });
        return null;
      }

      // Obtener header y footer
      const header = orgTemplates._header?.enabled ? orgTemplates._header.html : '';
      const footer = orgTemplates._footer?.enabled ? orgTemplates._footer.html : '';

      // Interpolar variables en contenido
      const interpolatedSubject = this.interpolateVariables(template.subject, variables);
      let interpolatedContent = this.interpolateVariables(
        template.html || this.getTemplateDefinitions()[templateId]?.html || '', 
        variables
      );

      // Envolver contenido con header y footer
      const fullHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; background-color: #f8fafc; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            ${header}
            <div style="padding: 30px;">
              ${interpolatedContent}
            </div>
            ${footer}
          </div>
        </div>
      `;

      return {
        subject: interpolatedSubject,
        html: fullHtml,
        textFallback: template.textFallback
      };
    } catch (error) {
      console.error("Error getting template with branding", { templateId, organizationId, error });
      return this.getTemplate(templateId, variables); // Fallback a template básico
    }
  }

  /**
   * Carga templates de organización desde la base de datos
   */
  private async getOrganizationTemplates(organizationId: string): Promise<any> {
    try {
      console.log(`🔍 Loading email templates for organization ${organizationId}`);
      
      const supabaseAdmin = getSupabaseAdmin();
      const { data: templates, error } = await supabaseAdmin
        .from('email_templates')
        .select('*')
        .eq('user_id', organizationId);
      
      if (error) {
        throw error;
      }

      // Convertir array a objeto con templateId como key
      const templatesObj: any = {};
      templates?.forEach(template => {
        templatesObj[template.name] = {
          subject: template.subject_template,
          html: template.html_template,
          textFallback: template.text_template
        };
      });
      
      console.log(`✅ Email templates loaded successfully:`, Object.keys(templatesObj));
      return templatesObj;
    } catch (error) {
      console.error("Error loading organization templates", { organizationId, error });
      throw error;
    }
  }

  /**
   * Definiciones de templates por defecto
   */
  private getTemplateDefinitions(): Record<string, ResendTemplate> {
    return {
      'welcome': {
        subject: "¡Bienvenido {{nombre}}!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">¡Hola {{nombre}}!</h1>
            <p>Te damos la bienvenida a nuestra plataforma de email marketing inteligente.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Próximos pasos:</strong></p>
              <ul>
                <li>Configura tu primer template</li>
                <li>Crea tu primera campaña</li>
                <li>Revisa nuestro dashboard de analytics</li>
              </ul>
            </div>
            <p>¡Estamos aquí para ayudarte a optimizar tus campañas!</p>
          </div>
        `,
        textFallback: "¡Hola {{nombre}}! Te damos la bienvenida a nuestra plataforma."
      },
      'campaign-success': {
        subject: "Campaña enviada exitosamente",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #28a745;">¡Campaña enviada!</h1>
            <p>Tu campaña "{{campaign_name}}" ha sido enviada exitosamente a {{contact_count}} contactos.</p>
            <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <p><strong>Estado:</strong> Enviada ✅</p>
              <p><strong>Contactos:</strong> {{contact_count}}</p>
              <p><strong>Fecha:</strong> {{sent_date}}</p>
            </div>
            <p>Puedes monitorear el rendimiento en tiempo real desde tu dashboard.</p>
          </div>
        `,
        textFallback: "Tu campaña {{campaign_name}} ha sido enviada exitosamente."
      },
      'automation-triggered': {
        subject: "Automatización activada",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #007bff;">Automatización en acción</h1>
            <p>Se ha activado una automatización basada en el evento: <strong>{{event_type}}</strong></p>
            <div style="background: #cce7ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
              <p><strong>Contacto:</strong> {{contact_email}}</p>
              <p><strong>Evento:</strong> {{event_type}}</p>
              <p><strong>Campaña:</strong> {{campaign_name}}</p>
            </div>
            <p>El sistema está adaptando automáticamente el contenido para optimizar la engagement.</p>
          </div>
        `,
        textFallback: "Automatización activada para {{contact_email}} en evento {{event_type}}"
      }
    };
  }

  /**
   * Interpolación avanzada de variables con soporte para expresiones
   */
  private interpolateVariables(template: string, variables: Record<string, any>): string {
    // Manejo de sintaxis tradicional {{variable}}
    template = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key]?.toString() || match;
    });
    
    // Manejo de expresiones en llaves simples {expression}
    template = template.replace(/\{([^{}]+)\}/g, (match, expression) => {
      try {
        expression = expression.trim();
        
        // Expresiones condicionales (operador ternario)
        if (expression.includes('?') && expression.includes(':')) {
          const result = this.evaluateConditionalExpression(expression, variables);
          return result !== null ? result : match;
        }
        
        // Acceso a propiedades (ej: user.profile.name)
        if (expression.includes('.')) {
          const result = this.evaluatePropertyAccess(expression, variables);
          return result !== null ? result : match;
        }
        
        // Referencia simple a variable
        return variables[expression]?.toString() || match;
      } catch (error) {
        console.warn(`Error evaluating expression "${expression}":`, error);
        return match;
      }
    });
    
    return template;
  }

  /**
   * Evalúa expresiones condicionales como: status === 'active' ? 'Activo' : 'Inactivo'
   */
  private evaluateConditionalExpression(expression: string, variables: Record<string, any>): string | null {
    try {
      const ternaryMatch = expression.match(/^(.+?)\s*\?\s*(.+?)\s*:\s*(.+)$/);
      if (!ternaryMatch) return null;
      
      const [, condition, valueTrue, valueFalse] = ternaryMatch;
      
      const conditionResult = this.evaluateCondition(condition.trim(), variables);
      
      if (conditionResult) {
        return this.evaluateValue(valueTrue.trim(), variables);
      } else {
        return this.evaluateValue(valueFalse.trim(), variables);
      }
    } catch (error) {
      console.warn(`Error evaluating conditional expression "${expression}":`, error);
      return null;
    }
  }

  /**
   * Evalúa condiciones como: status === 'active'
   */
  private evaluateCondition(condition: string, variables: Record<string, any>): boolean {
    try {
      if (condition.includes('===')) {
        const [left, right] = condition.split('===').map(s => s.trim());
        const leftValue = this.evaluateValue(left, variables);
        const rightValue = this.evaluateValue(right, variables);
        return leftValue === rightValue;
      }
      
      if (condition.includes('!==')) {
        const [left, right] = condition.split('!==').map(s => s.trim());
        const leftValue = this.evaluateValue(left, variables);
        const rightValue = this.evaluateValue(right, variables);
        return leftValue !== rightValue;
      }
      
      const value = this.evaluateValue(condition, variables);
      return !!value;
    } catch (error) {
      console.warn(`Error evaluating condition "${condition}":`, error);
      return false;
    }
  }

  /**
   * Evalúa un valor que puede ser variable, acceso a propiedad o literal
   */
  private evaluateValue(value: string, variables: Record<string, any>): any {
    // String literals con comillas
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      return value.slice(1, -1);
    }
    
    // Acceso a propiedades
    if (value.includes('.')) {
      return this.evaluatePropertyAccess(value, variables);
    }
    
    // Variable simple
    return variables[value] || value;
  }

  /**
   * Evalúa acceso a propiedades como: user.profile.name
   */
  private evaluatePropertyAccess(path: string, variables: Record<string, any>): any {
    try {
      const parts = path.split('.');
      let result = variables;
      
      for (const part of parts) {
        if (result && typeof result === 'object' && part in result) {
          result = result[part];
        } else {
          return null;
        }
      }
      
      return result;
    } catch (error) {
      console.warn(`Error evaluating property access "${path}":`, error);
      return null;
    }
  }

  /**
   * Validación de email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Guarda petición de integración en la base de datos
   */
  private async saveIntegrationRequest(data: {
    organizationId: string;
    method: string;
    endpoint: string;
    body: any;
    status: number;
    response: string;
  }): Promise<void> {
    try {
      // En un sistema real, esto iría a una tabla de logs
      console.log('Integration request logged:', data);
    } catch (error) {
      console.error('Error saving integration request:', error);
    }
  }

  // === WEBHOOK EVENT HANDLERS ===

  private async handleEmailDelivered(data: any): Promise<void> {
    console.log('Email delivered', data);
    
    try {
      const supabaseAdmin = getSupabaseAdmin();
      
      // Actualizar estado en email_logs
      await supabaseAdmin
        .from('email_logs')
        .update({ 
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('email_id', data.email_id);

      // Registrar evento
      await supabaseAdmin
        .from('email_events')
        .insert({
          type: 'email.delivered',
          email_id: data.email_id,
          data: data,
          user_id: 'system'
        });

    } catch (error) {
      console.error('Error handling email delivered:', error);
    }
  }

  private async handleEmailBounced(data: any): Promise<void> {
    console.error('Email bounced', data);
    
    try {
      const supabaseAdmin = getSupabaseAdmin();
      
      // Actualizar estado del contacto
      await supabaseAdmin
        .from('contacts')
        .update({ status: 'bounced' })
        .eq('email', data.to[0]);

      // Registrar evento
      await supabaseAdmin
        .from('email_events')
        .insert({
          type: 'email.bounced',
          email_id: data.email_id,
          data: data,
          user_id: 'system'
        });

    } catch (error) {
      console.error('Error handling email bounced:', error);
    }
  }

  private async handleEmailOpened(data: any): Promise<void> {
    console.log('Email opened', data);
    
    try {
      const supabaseAdmin = getSupabaseAdmin();
      
      // Actualizar timestamp de apertura
      await supabaseAdmin
        .from('email_logs')
        .update({ 
          status: 'opened',
          opened_at: new Date().toISOString()
        })
        .eq('email_id', data.email_id);

      // Registrar evento
      await supabaseAdmin
        .from('email_events')
        .insert({
          type: 'email.opened',
          email_id: data.email_id,
          data: data,
          user_id: 'system'
        });

    } catch (error) {
      console.error('Error handling email opened:', error);
    }
  }

  private async handleEmailClicked(data: any): Promise<void> {
    console.log('Email clicked', data);
    
    try {
      const supabaseAdmin = getSupabaseAdmin();
      
      // Actualizar timestamp de clic
      await supabaseAdmin
        .from('email_logs')
        .update({ 
          status: 'clicked',
          clicked_at: new Date().toISOString()
        })
        .eq('email_id', data.email_id);

      // Registrar evento
      await supabaseAdmin
        .from('email_events')
        .insert({
          type: 'email.clicked',
          email_id: data.email_id,
          data: data,
          user_id: 'system'
        });

    } catch (error) {
      console.error('Error handling email clicked:', error);
    }
  }

  private async handleEmailComplained(data: any): Promise<void> {
    console.error('Email complained', data);
    
    try {
      const supabaseAdmin = getSupabaseAdmin();
      
      // Marcar contacto como quejoso
      await supabaseAdmin
        .from('contacts')
        .update({ status: 'complained' })
        .eq('email', data.to[0]);

      // Registrar evento
      await supabaseAdmin
        .from('email_events')
        .insert({
          type: 'email.complained',
          email_id: data.email_id,
          data: data,
          user_id: 'system'
        });

    } catch (error) {
      console.error('Error handling email complained:', error);
    }
  }

  private async handleEmailFailed(data: any): Promise<void> {
    console.error('Email failed', data);
    
    try {
      const supabaseAdmin = getSupabaseAdmin();
      
      // Registrar evento de fallo
      await supabaseAdmin
        .from('email_events')
        .insert({
          type: 'email.failed',
          email_id: data.email_id,
          data: data,
          user_id: 'system'
        });

    } catch (error) {
      console.error('Error handling email failed:', error);
    }
  }
}

// Instancia singleton
export const resendService = new ResendService(); 