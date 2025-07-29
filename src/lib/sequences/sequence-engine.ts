import { EmailSequenceRule, EmailSequence, SequenceExecution, SequenceCondition, EmailSequenceAction, EmailSequenceValues } from '@/types/sequences';
import { EmailEventType } from '@/types/email';
import { getSupabaseAdmin } from '@/lib/supabase';
import { resendService } from '@/lib/resend-service';
import { predefinedSequences } from './predefined-sequences';

// === SEQUENCE ENGINE CLASS ===
export class SequenceEngine {
  private getSupabase() {
    return getSupabaseAdmin();
  }

  /**
   * Procesa un evento de email y ejecuta las secuencias correspondientes
   */
  async processEmailEvent(eventType: EmailEventType, eventData: any): Promise<void> {
    console.log(`🔄 SequenceEngine: Processing event ${eventType}`, eventData);

    try {
      // Mapear evento de Resend a trigger de secuencia
      const trigger = this.mapEventToTrigger(eventType);
      if (!trigger) {
        console.log(`⚠️ No trigger mapping for event: ${eventType}`);
        return;
      }

      // Obtener contacto del evento
      const contact = await this.getContactFromEvent(eventData);
      if (!contact) {
        console.log(`⚠️ No contact found for event data:`, eventData);
        return;
      }

      // Buscar secuencias activas para este contacto
      const activeSequences = await this.getActiveSequencesForContact(contact.id);
      
      // Procesar cada secuencia activa
      for (const sequence of activeSequences) {
        await this.processSequenceForTrigger(sequence, trigger, contact, eventData);
      }

      // Buscar nuevas secuencias que se puedan iniciar
      await this.checkForNewSequences(trigger, contact, eventData);

    } catch (error) {
      console.error('❌ Error processing email event in SequenceEngine:', error);
      throw error;
    }
  }

  /**
   * Inicia una secuencia para un contacto específico
   */
  async startSequence(sequenceId: string, contactId: string, variables: Record<string, any> = {}): Promise<string> {
    console.log(`🚀 Starting sequence ${sequenceId} for contact ${contactId}`);

    try {
      // Verificar que no haya secuencia activa del mismo tipo
      const existingExecution = await this.getActiveSequenceExecution(sequenceId, contactId);
      if (existingExecution) {
        console.log(`⚠️ Sequence ${sequenceId} already active for contact ${contactId}`);
        return existingExecution.id;
      }

      // Crear nueva ejecución de secuencia
      const execution: SequenceExecution = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sequenceId,
        contactId,
        status: 'active',
        currentStep: 0,
        totalSteps: this.getTotalStepsForSequence(sequenceId),
        startedAt: new Date().toISOString(),
        variables,
        executionLog: []
      };

      // Guardar en base de datos
      await this.saveSequenceExecution(execution);

      // Procesar regla inicial
      const sequence = this.getSequenceById(sequenceId);
      if (sequence) {
        const contact = await this.getContactById(contactId);
        if (contact) {
          await this.processSequenceForTrigger(sequence, 'onSequenceStarted', contact, { sequenceId, contactId });
        }
      }

      return execution.id;
    } catch (error) {
      console.error('❌ Error starting sequence:', error);
      throw error;
    }
  }

  /**
   * Mapea eventos de Resend a triggers de secuencia
   */
  private mapEventToTrigger(eventType: EmailEventType): string | null {
    const eventMapping: Record<EmailEventType, string> = {
      'email.sent': 'onEmailSent',
      'email.delivered': 'onEmailDelivered',
      'email.opened': 'onEmailOpened',
      'email.clicked': 'onEmailClicked',
      'email.bounced': 'onEmailBounced',
      'email.complained': 'onEmailComplained',
      'email.failed': 'onEmailFailed',
      'email.delivery_delayed': 'onEmailFailed' // Tratamos delay como fallo temporal
    };

    return eventMapping[eventType] || null;
  }

  /**
   * Procesa una secuencia para un trigger específico
   */
  private async processSequenceForTrigger(
    sequence: EmailSequence, 
    trigger: string, 
    contact: any, 
    eventData: any
  ): Promise<void> {
    console.log(`🔍 Processing sequence ${sequence.id} for trigger ${trigger}`);

    // Filtrar reglas que coinciden con el trigger
    const matchingRules = sequence.rules
      .filter(rule => rule.enabled && rule.trigger === trigger)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of matchingRules) {
      try {
        // Evaluar condiciones
        const shouldExecute = await this.evaluateConditions(rule, contact, eventData);
        
        if (shouldExecute) {
          console.log(`✅ Executing rule ${rule.id} for contact ${contact.id}`);
          await this.executeRule(rule, contact, eventData);
        } else {
          console.log(`⏭️ Skipping rule ${rule.id} - conditions not met`);
        }
      } catch (error) {
        console.error(`❌ Error executing rule ${rule.id}:`, error);
      }
    }
  }

  /**
   * Evalúa condiciones de una regla
   */
  private async evaluateConditions(rule: EmailSequenceRule, contact: any, eventData: any): Promise<boolean> {
    if (!rule.conditions) return true;

    const context = {
      contact,
      event: eventData,
      email: eventData,
      ...eventData
    };

    // Evaluar condiciones ALL (todas deben cumplirse)
    if (rule.conditions.all) {
      for (const condition of rule.conditions.all) {
        if (!this.evaluateCondition(condition, context)) {
          return false;
        }
      }
    }

    // Evaluar condiciones ANY (al menos una debe cumplirse)
    if (rule.conditions.any) {
      let anyMatch = false;
      for (const condition of rule.conditions.any) {
        if (this.evaluateCondition(condition, context)) {
          anyMatch = true;
          break;
        }
      }
      if (!anyMatch) return false;
    }

    return true;
  }

  /**
   * Evalúa una condición individual
   */
  private evaluateCondition(condition: SequenceCondition, context: any): boolean {
    const value = this.getNestedValue(context, condition.fact);
    
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'notEquals':
        return value !== condition.value;
      case 'contains':
        return Array.isArray(value) ? value.includes(condition.value) : 
               typeof value === 'string' ? value.includes(condition.value) : false;
      case 'notContains':
        return Array.isArray(value) ? !value.includes(condition.value) : 
               typeof value === 'string' ? !value.includes(condition.value) : true;
      case 'greaterThan':
        return Number(value) > Number(condition.value);
      case 'lessThan':
        return Number(value) < Number(condition.value);
      case 'greaterThanEqual':
        return Number(value) >= Number(condition.value);
      case 'lessThanEqual':
        return Number(value) <= Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'notIn':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      case 'exists':
        return value !== undefined && value !== null;
      case 'notExists':
        return value === undefined || value === null;
      default:
        console.warn(`Unknown operator: ${condition.operator}`);
        return false;
    }
  }

  /**
   * Ejecuta una regla específica
   */
  private async executeRule(rule: EmailSequenceRule, contact: any, eventData: any): Promise<void> {
    // Aplicar timing si existe
    if (rule.timing && rule.timing.delay !== 'immediate') {
      await this.scheduleRuleExecution(rule, contact, eventData);
      return;
    }

    // Ejecutar inmediatamente
    await this.executeAction(rule.action, rule.values, contact, eventData);
    
    // Log execution
    await this.logRuleExecution(rule, contact, 'success');
  }

  /**
   * Ejecuta una acción específica
   */
  private async executeAction(
    action: EmailSequenceAction, 
    values: EmailSequenceValues, 
    contact: any, 
    eventData: any
  ): Promise<void> {
    console.log(`🎬 Executing action: ${action}`);

    switch (action) {
      case 'sendSequenceEmail':
        await this.executeSendSequenceEmail(values, contact);
        break;
      
      case 'addContactTag':
        await this.executeAddContactTag(values, contact);
        break;
      
      case 'removeContactTag':
        await this.executeRemoveContactTag(values, contact);
        break;
      
      case 'updateContactField':
        await this.executeUpdateContactField(values, contact);
        break;
      
      case 'endSequence':
        await this.executeEndSequence(values, contact);
        break;
      
      case 'pauseSequence':
        await this.executePauseSequence(values, contact);
        break;
      
      case 'moveToSequence':
        await this.executeMoveToSequence(values, contact);
        break;
      
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }

  /**
   * Envía email de secuencia
   */
  private async executeSendSequenceEmail(values: EmailSequenceValues, contact: any): Promise<void> {
    if (!values.templateId) {
      throw new Error('Template ID is required for sendSequenceEmail action');
    }

    try {
      const emailResult = await resendService.sendTemplateEmail({
        templateId: values.templateId,
        recipient: {
          email: contact.email,
          name: contact.name || 'Usuario',
          contactId: contact.id
        },
        organizationId: 'default',
        variables: {
          contact,
          ...values.personalizations,
          ...values.variables
        }
      });

      console.log(`📧 Sequence email sent: ${emailResult.id}`);

      // Actualizar tags si se especifican
      if (values.tagsToAdd || values.tagsToRemove) {
        await this.updateContactTags(contact.id, values.tagsToAdd, values.tagsToRemove);
      }

    } catch (error) {
      console.error('❌ Error sending sequence email:', error);
      throw error;
    }
  }

  /**
   * Agrega tags a un contacto
   */
  private async executeAddContactTag(values: EmailSequenceValues, contact: any): Promise<void> {
    if (values.tagsToAdd && values.tagsToAdd.length > 0) {
      await this.updateContactTags(contact.id, values.tagsToAdd, []);
    }
  }

  /**
   * Remueve tags de un contacto
   */
  private async executeRemoveContactTag(values: EmailSequenceValues, contact: any): Promise<void> {
    if (values.tagsToRemove && values.tagsToRemove.length > 0) {
      await this.updateContactTags(contact.id, [], values.tagsToRemove);
    }
  }

  /**
   * Actualiza tags de contacto en la base de datos
   */
  private async updateContactTags(contactId: string, tagsToAdd: string[] = [], tagsToRemove: string[] = []): Promise<void> {
    try {
      // Obtener tags actuales
      const { data: contact } = await this.getSupabase()
        .from('contacts')
        .select('tags')
        .eq('id', contactId)
        .single();

      if (!contact) return;

      let currentTags: string[] = contact.tags || [];

      // Agregar nuevos tags
      for (const tag of tagsToAdd) {
        if (!currentTags.includes(tag)) {
          currentTags.push(tag);
        }
      }

      // Remover tags
      currentTags = currentTags.filter(tag => !tagsToRemove.includes(tag));

      // Actualizar en base de datos
      await this.getSupabase()
        .from('contacts')
        .update({ tags: currentTags })
        .eq('id', contactId);

      console.log(`🏷️ Tags updated for contact ${contactId}: +${tagsToAdd} -${tagsToRemove}`);
    } catch (error) {
      console.error('❌ Error updating contact tags:', error);
      throw error;
    }
  }

  /**
   * Obtiene valor anidado de un objeto usando notación de punto
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Obtiene contacto desde los datos del evento
   */
  private async getContactFromEvent(eventData: any): Promise<any> {
    const email = eventData.to?.[0] || eventData.email;
    if (!email) return null;

    const { data: contact } = await this.getSupabase()
      .from('contacts')
      .select('*')
      .eq('email', email)
      .single();

    return contact;
  }

  /**
   * Obtiene secuencias activas para un contacto
   */
  private async getActiveSequencesForContact(contactId: string): Promise<EmailSequence[]> {
    // En una implementación real, esto vendría de la base de datos
    // Por ahora, devolvemos las secuencias predefinidas
    return predefinedSequences.filter(seq => seq.enabled);
  }

  /**
   * Busca nuevas secuencias que se puedan iniciar
   */
  private async checkForNewSequences(trigger: string, contact: any, eventData: any): Promise<void> {
    // Lógica para iniciar nuevas secuencias basada en triggers
    if (trigger === 'onEmailOpened' && !contact.tags?.includes('Secuencia Welcome')) {
      await this.startSequence('SEQ-WELCOME-001', contact.id);
    }
  }

  // === MÉTODOS HELPER ===
  private getSequenceById(sequenceId: string): EmailSequence | null {
    return predefinedSequences.find(seq => seq.id === sequenceId) || null;
  }

  private async getContactById(contactId: string): Promise<any> {
    const { data: contact } = await this.getSupabase()
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();
    return contact;
  }

  private getTotalStepsForSequence(sequenceId: string): number {
    const sequence = this.getSequenceById(sequenceId);
    return sequence ? sequence.rules.length : 0;
  }

  private async getActiveSequenceExecution(sequenceId: string, contactId: string): Promise<any> {
    // Implementar búsqueda en base de datos
    return null;
  }

  private async saveSequenceExecution(execution: SequenceExecution): Promise<void> {
    // Implementar guardado en base de datos
    console.log('💾 Saving sequence execution:', execution.id);
  }

  private async scheduleRuleExecution(rule: EmailSequenceRule, contact: any, eventData: any): Promise<void> {
    // Implementar programación de tareas con timing
    console.log(`⏰ Scheduling rule ${rule.id} with delay ${rule.timing?.delay}`);
  }

  private async logRuleExecution(rule: EmailSequenceRule, contact: any, status: 'success' | 'failed'): Promise<void> {
    // Implementar logging de ejecución
    console.log(`📝 Rule ${rule.id} executed with status: ${status}`);
  }

  // Implementar otros métodos de ejecución...
  private async executeUpdateContactField(values: EmailSequenceValues, contact: any): Promise<void> {
    console.log('🔄 Updating contact field:', values.fieldName);
  }

  private async executeEndSequence(values: EmailSequenceValues, contact: any): Promise<void> {
    console.log('🏁 Ending sequence for contact:', contact.id);
  }

  private async executePauseSequence(values: EmailSequenceValues, contact: any): Promise<void> {
    console.log('⏸️ Pausing sequence for contact:', contact.id);
  }

  private async executeMoveToSequence(values: EmailSequenceValues, contact: any): Promise<void> {
    console.log('🔄 Moving to sequence:', values.targetSequenceId);
  }
}

// === EXPORTAR INSTANCIA SINGLETON ===
export const sequenceEngine = new SequenceEngine(); 