// === EMAIL SEQUENCE TYPES ===
export interface EmailSequenceRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  
  // Trigger: cuándo se dispara la secuencia
  trigger: EmailSequenceTrigger;
  
  // Conditions: cuándo NO continuar
  conditions?: SequenceConditions;
  
  // Actions: qué hacer
  action: EmailSequenceAction;
  
  // Values: parámetros específicos
  values: EmailSequenceValues;
  
  // Timing: cuándo ejecutar
  timing?: SequenceTiming;
}

// === TRIGGERS ===
export type EmailSequenceTrigger = 
  | 'onEmailSent'           // Email enviado
  | 'onEmailOpened'         // Email abierto
  | 'onEmailClicked'        // Email clickeado
  | 'onEmailBounced'        // Email rebotado
  | 'onEmailComplained'     // Marcado como spam
  | 'onEmailDelivered'      // Email entregado
  | 'onEmailFailed'         // Email falló
  | 'onContactCreated'      // Contacto creado
  | 'onSequenceStarted'     // Secuencia iniciada
  | 'onTimeElapsed';        // Tiempo transcurrido

// === ACTIONS ===
export type EmailSequenceAction = 
  | 'sendSequenceEmail'     // Enviar siguiente email de secuencia
  | 'addContactTag'         // Agregar etiqueta a contacto
  | 'removeContactTag'      // Remover etiqueta a contacto
  | 'updateContactField'    // Actualizar campo de contacto
  | 'endSequence'           // Terminar secuencia
  | 'pauseSequence'         // Pausar secuencia
  | 'moveToSequence'        // Mover a otra secuencia
  | 'waitForAction'         // Esperar acción específica
  | 'sendNotification';     // Enviar notificación interna

// === SEQUENCE CONDITIONS ===
export interface SequenceConditions {
  all?: SequenceCondition[];
  any?: SequenceCondition[];
}

export interface SequenceCondition {
  fact: string;             // Campo a evaluar (ej: "email.openCount", "contact.tags")
  operator: SequenceOperator;
  value: any;
}

export type SequenceOperator = 
  | 'equals' | 'notEquals'
  | 'contains' | 'notContains'
  | 'greaterThan' | 'lessThan'
  | 'greaterThanEqual' | 'lessThanEqual'
  | 'in' | 'notIn'
  | 'exists' | 'notExists';

// === SEQUENCE VALUES ===
export interface EmailSequenceValues {
  // Para sendSequenceEmail
  templateId?: string;
  subject?: string;
  personalizations?: Record<string, any>;
  
  // Para tags
  tagsToAdd?: string[];
  tagsToRemove?: string[];
  
  // Para campos
  fieldName?: string;
  fieldValue?: any;
  
  // Para secuencias
  targetSequenceId?: string;
  
  // Para timing
  waitDuration?: string; // "1h", "2d", "1w"
  
  // Variables dinámicas
  variables?: Record<string, any>;
}

// === SEQUENCE TIMING ===
export interface SequenceTiming {
  delay: string;            // "immediate", "1h", "2d", "1w"
  maxRetries?: number;      // Máximo intentos
  retryDelay?: string;      // Delay entre reintentos
}

// === EMAIL SEQUENCE DEFINITION ===
export interface EmailSequence {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  
  // Configuración de la secuencia
  config: SequenceConfig;
  
  // Reglas de la secuencia
  rules: EmailSequenceRule[];
  
  // Métricas
  metrics?: SequenceMetrics;
}

export interface SequenceConfig {
  maxDuration?: string;     // "30d" - máximo tiempo de secuencia
  maxEmails?: number;       // Máximo emails por secuencia
  cooldownPeriod?: string;  // "24h" - tiempo entre emails
  timezone?: string;        // Zona horaria para timing
  sendingWindow?: {         // Ventana de envío
    start: string;          // "09:00"
    end: string;            // "18:00"
    days: number[];         // [1,2,3,4,5] = lunes a viernes
  };
}

export interface SequenceMetrics {
  totalContacts: number;
  activeContacts: number;
  completedContacts: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
}

// === SEQUENCE EXECUTION ===
export interface SequenceExecution {
  id: string;
  sequenceId: string;
  contactId: string;
  status: SequenceExecutionStatus;
  
  currentStep: number;
  totalSteps: number;
  
  startedAt: string;
  lastActionAt?: string;
  completedAt?: string;
  
  variables: Record<string, any>;
  executionLog: SequenceExecutionLog[];
}

export type SequenceExecutionStatus = 
  | 'active'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface SequenceExecutionLog {
  timestamp: string;
  ruleId: string;
  action: EmailSequenceAction;
  status: 'success' | 'failed' | 'skipped';
  details?: any;
  error?: string;
}

// === PREDEFINED SEQUENCES ===
export type PredefinedSequenceType = 
  | 'welcome-series'        // Serie de bienvenida
  | 'nurture-campaign'      // Campaña de nutrición
  | 'abandoned-cart'        // Carrito abandonado
  | 'win-back'              // Reactivación
  | 'product-education'     // Educación de producto
  | 'onboarding-flow';      // Flujo de onboarding 