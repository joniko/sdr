import { EmailSequence, EmailSequenceRule } from '@/types/sequences';

// === SECUENCIA 1: SERIE DE BIENVENIDA ===
export const welcomeSeriesSequence: EmailSequence = {
  id: "SEQ-WELCOME-001",
  name: "Serie de Bienvenida Inteligente",
  description: "Secuencia de 4 emails que se adapta según el comportamiento del usuario",
  enabled: true,
  config: {
    maxDuration: "14d",
    maxEmails: 4,
    cooldownPeriod: "6h",
    timezone: "America/Argentina/Buenos_Aires",
    sendingWindow: {
      start: "09:00",
      end: "18:00",
      days: [1, 2, 3, 4, 5] // Lunes a viernes
    }
  },
  rules: [
    // Email 1: Bienvenida inmediata
    {
      id: "WELCOME-EMAIL-01",
      name: "Email de Bienvenida",
      description: "Primer email enviado inmediatamente tras la suscripción",
      enabled: true,
      priority: 1,
      trigger: "onContactCreated",
      action: "sendSequenceEmail",
      timing: {
        delay: "immediate"
      },
      values: {
        templateId: "WEL-001",
        subject: "¡Bienvenido/a {{contact.name}}! 🎉",
        personalizations: {
          nombre: "{{contact.name}}",
          email: "{{contact.email}}",
          fechaRegistro: "{{today}}"
        },
        tagsToAdd: ["Secuencia Welcome", "Email 1 Enviado"]
      }
    },
    
    // Email 2: Seguimiento si abrió el primer email
    {
      id: "WELCOME-EMAIL-02-OPENED",
      name: "Email de Seguimiento - Usuario Interesado",
      description: "Segundo email para usuarios que abrieron el primer email",
      enabled: true,
      priority: 10,
      trigger: "onEmailOpened",
      timing: {
        delay: "24h"
      },
      conditions: {
        all: [
          {
            fact: "email.templateId",
            operator: "equals",
            value: "WEL-001"
          },
          {
            fact: "contact.tags",
            operator: "contains",
            value: "Secuencia Welcome"
          }
        ]
      },
      action: "sendSequenceEmail",
      values: {
        templateId: "WEL-002",
        subject: "{{contact.name}}, esto te va a encantar 💡",
        personalizations: {
          nombre: "{{contact.name}}",
          contenidoPersonalizado: "{{getRecommendedContent(contact)}}"
        },
        tagsToAdd: ["Email 2 Enviado", "Usuario Interesado"],
        tagsToRemove: ["Email 1 Enviado"]
      }
    },
    
    // Email 2 Alternativo: Para usuarios que NO abrieron
    {
      id: "WELCOME-EMAIL-02-NOT-OPENED",
      name: "Email de Reactivación - Usuario Pasivo",
      description: "Email alternativo para usuarios que no abrieron el primero",
      enabled: true,
      priority: 11,
      trigger: "onTimeElapsed",
      timing: {
        delay: "48h"
      },
      conditions: {
        all: [
          {
            fact: "contact.tags",
            operator: "contains",
            value: "Email 1 Enviado"
          },
          {
            fact: "email.openCount",
            operator: "equals",
            value: 0
          }
        ]
      },
      action: "sendSequenceEmail",
      values: {
        templateId: "WEL-002-ALT",
        subject: "¿Te perdiste esto? 📧 (Reabrimos para ti)",
        personalizations: {
          nombre: "{{contact.name}}",
          motivoReactivacion: "No queremos que te pierdas contenido valioso"
        },
        tagsToAdd: ["Email Reactivación Enviado", "Usuario Pasivo"],
        tagsToRemove: ["Email 1 Enviado"]
      }
    },
    
    // Email 3: Engagement boost si clickeó
    {
      id: "WELCOME-EMAIL-03-CLICKED",
      name: "Email de Engagement Avanzado",
      description: "Tercer email para usuarios que hicieron click",
      enabled: true,
      priority: 20,
      trigger: "onEmailClicked",
      timing: {
        delay: "72h"
      },
      conditions: {
        all: [
          {
            fact: "contact.tags",
            operator: "contains",
            value: "Usuario Interesado"
          }
        ]
      },
      action: "sendSequenceEmail",
      values: {
        templateId: "WEL-003",
        subject: "{{contact.name}}, acceso exclusivo desbloqueado 🔓",
        personalizations: {
          nombre: "{{contact.name}}",
          contenidoExclusivo: "{{getPremiumContent(contact)}}",
          llamadaAccion: "Únete a nuestro programa VIP"
        },
        tagsToAdd: ["Email 3 Enviado", "Usuario Muy Interesado"],
        tagsToRemove: ["Email 2 Enviado"]
      }
    },
    
    // Email 4: Final de secuencia o last chance
    {
      id: "WELCOME-EMAIL-04-FINAL",
      name: "Email Final - Call to Action",
      description: "Último email de la secuencia con CTA fuerte",
      enabled: true,
      priority: 30,
      trigger: "onTimeElapsed",
      timing: {
        delay: "7d"
      },
      conditions: {
        any: [
          {
            fact: "contact.tags",
            operator: "contains",
            value: "Usuario Muy Interesado"
          },
          {
            fact: "contact.tags",
            operator: "contains",
            value: "Usuario Pasivo"
          }
        ]
      },
      action: "sendSequenceEmail",
      values: {
        templateId: "WEL-004",
        subject: "Última oportunidad: {{contact.name}} 🚀",
        personalizations: {
          nombre: "{{contact.name}}",
          ofertaEspecial: "{{getSpecialOffer(contact)}}",
          urgencia: "Solo hasta el {{getExpirationDate()}}"
        },
        tagsToAdd: ["Secuencia Completada"],
        tagsToRemove: ["Secuencia Welcome"]
      }
    },
    
    // Regla de limpieza: Finalizar secuencia
    {
      id: "WELCOME-CLEANUP",
      name: "Finalizar Secuencia Welcome",
      description: "Limpia tags y finaliza la secuencia",
      enabled: true,
      priority: 99,
      trigger: "onTimeElapsed",
      timing: {
        delay: "14d"
      },
      conditions: {
        all: [
          {
            fact: "contact.tags",
            operator: "contains",
            value: "Secuencia Welcome"
          }
        ]
      },
      action: "endSequence",
      values: {
        tagsToRemove: ["Secuencia Welcome", "Email 1 Enviado", "Email 2 Enviado", "Email 3 Enviado"],
        tagsToAdd: ["Welcome Completado - No Convertido"]
      }
    }
  ]
};

// === SECUENCIA 2: RECUPERACIÓN DE ENGAGEMENT ===
export const engagementBoosterSequence: EmailSequence = {
  id: "SEQ-ENGAGEMENT-001",
  name: "Recuperación de Engagement",
  description: "Para usuarios que abren emails pero no hacen click - 3 emails estratégicos",
  enabled: true,
  config: {
    maxDuration: "10d",
    maxEmails: 3,
    cooldownPeriod: "12h",
    timezone: "America/Argentina/Buenos_Aires"
  },
  rules: [
    // Trigger: Usuario abre pero no hace click en 48h
    {
      id: "ENGAGEMENT-TRIGGER",
      name: "Detectar Usuario Pasivo",
      description: "Detecta usuarios que abren pero no hacen click",
      enabled: true,
      priority: 1,
      trigger: "onTimeElapsed",
      timing: {
        delay: "48h"
      },
      conditions: {
        all: [
          {
            fact: "email.openCount",
            operator: "greaterThan",
            value: 0
          },
          {
            fact: "email.clickCount",
            operator: "equals",
            value: 0
          },
          {
            fact: "contact.tags",
            operator: "notContains",
            value: "Engagement Activo"
          }
        ]
      },
      action: "addContactTag",
      values: {
        tagsToAdd: ["Engagement Necesario", "Secuencia Engagement"]
      }
    },
    
    // Email 1: Contenido de valor
    {
      id: "ENGAGEMENT-EMAIL-01",
      name: "Email de Valor Directo",
      description: "Primer email con contenido muy valioso",
      enabled: true,
      priority: 10,
      trigger: "onTimeElapsed",
      timing: {
        delay: "2h"
      },
      conditions: {
        all: [
          {
            fact: "contact.tags",
            operator: "contains",
            value: "Engagement Necesario"
          }
        ]
      },
      action: "sendSequenceEmail",
      values: {
        templateId: "ENG-001",
        subject: "{{contact.name}}, te preparé algo especial 🎁",
        personalizations: {
          nombre: "{{contact.name}}",
          contenidoValor: "{{getHighValueContent(contact)}}",
          beneficioClaro: "En 5 minutos tendrás resultados concretos"
        },
        tagsToAdd: ["Engagement Email 1 Enviado"]
      }
    },
    
    // Email 2: Social proof y testimonios
    {
      id: "ENGAGEMENT-EMAIL-02",
      name: "Email de Social Proof",
      description: "Segundo email con testimonios y casos de éxito",
      enabled: true,
      priority: 20,
      trigger: "onTimeElapsed",
      timing: {
        delay: "3d"
      },
      conditions: {
        all: [
          {
            fact: "contact.tags",
            operator: "contains",
            value: "Engagement Email 1 Enviado"
          }
        ]
      },
      action: "sendSequenceEmail",
      values: {
        templateId: "ENG-002",
        subject: "Mira lo que lograron otros como {{contact.name}} 👥",
        personalizations: {
          nombre: "{{contact.name}}",
          testimonios: "{{getRelevantTestimonials(contact)}}",
          casosExito: "{{getSuccessStories(contact)}}"
        },
        tagsToAdd: ["Engagement Email 2 Enviado"]
      }
    },
    
    // Email 3: Offer irresistible
    {
      id: "ENGAGEMENT-EMAIL-03",
      name: "Email de Oferta Irresistible",
      description: "Tercer email con oferta muy atractiva",
      enabled: true,
      priority: 30,
      trigger: "onTimeElapsed",
      timing: {
        delay: "5d"
      },
      conditions: {
        all: [
          {
            fact: "contact.tags",
            operator: "contains",
            value: "Engagement Email 2 Enviado"
          }
        ]
      },
      action: "sendSequenceEmail",
      values: {
        templateId: "ENG-003",
        subject: "{{contact.name}}, solo para ti: 50% OFF 🎯",
        personalizations: {
          nombre: "{{contact.name}}",
          ofertaPersonalizada: "{{getPersonalizedOffer(contact)}}",
          descuentoEspecial: "50% de descuento válido hasta {{getOfferExpiration()}}",
          razonUrgencia: "Solo 24 horas para aprovechar"
        },
        tagsToAdd: ["Oferta Especial Enviada"],
        tagsToRemove: ["Engagement Necesario"]
      }
    }
  ]
};

// === SECUENCIA 3: URGENCIA Y CONVERSIÓN ===
export const urgencyConversionSequence: EmailSequence = {
  id: "SEQ-URGENCY-001",
  name: "Urgencia y Conversión",
  description: "Para usuarios que muestran interés alto - secuencia de conversión intensiva",
  enabled: true,
  config: {
    maxDuration: "7d",
    maxEmails: 4,
    cooldownPeriod: "4h"
  },
  rules: [
    // Trigger automático para usuarios con alta engagement
    {
      id: "URGENCY-TRIGGER",
      name: "Usuario Alta Engagement",
      description: "Detecta usuarios con clicks múltiples",
      enabled: true,
      priority: 1,
      trigger: "onEmailClicked",
      conditions: {
        all: [
          {
            fact: "contact.totalClicks",
            operator: "greaterThan",
            value: 2
          }
        ]
      },
      action: "addContactTag",
      values: {
        tagsToAdd: ["Alto Interés", "Secuencia Urgencia"]
      }
    },
    
    // Email 1: Urgencia moderada
    {
      id: "URGENCY-EMAIL-01",
      name: "Email de Urgencia Inicial",
      description: "Primer email creando urgencia",
      enabled: true,
      priority: 10,
      trigger: "onTimeElapsed",
      timing: {
        delay: "1h"
      },
      conditions: {
        all: [
          {
            fact: "contact.tags",
            operator: "contains",
            value: "Alto Interés"
          }
        ]
      },
      action: "sendSequenceEmail",
      values: {
        templateId: "URG-001",
        subject: "{{contact.name}}, quedan pocas plazas disponibles ⏰",
        personalizations: {
          nombre: "{{contact.name}}",
          plazasRestantes: "{{getAvailableSpots()}}",
          tiempoLimite: "Solo hasta {{getDeadline()}}"
        }
      }
    },
    
    // Email 2: Urgencia alta
    {
      id: "URGENCY-EMAIL-02",
      name: "Email de Urgencia Media",
      description: "Segundo email incrementando urgencia",
      enabled: true,
      priority: 20,
      trigger: "onTimeElapsed",
      timing: {
        delay: "24h"
      },
      action: "sendSequenceEmail",
      values: {
        templateId: "URG-002",
        subject: "🚨 ÚLTIMO AVISO: {{contact.name}}, se acaba hoy",
        personalizations: {
          nombre: "{{contact.name}}",
          horasRestantes: "{{getHoursRemaining()}}",
          beneficiosUltimos: "{{getFinalBenefits()}}"
        }
      }
    }
  ]
};

// === SECUENCIA 4: ÚLTIMA OPORTUNIDAD ===
export const lastChanceSequence: EmailSequence = {
  id: "SEQ-LASTCHANCE-001",
  name: "Última Oportunidad",
  description: "Secuencia final para recuperar contactos perdidos",
  enabled: true,
  config: {
    maxDuration: "5d",
    maxEmails: 3,
    cooldownPeriod: "24h"
  },
  rules: [
    // Email 1: Reconnect emocional
    {
      id: "LASTCHANCE-EMAIL-01",
      name: "Email de Reconexión",
      description: "Reestablecer conexión emocional",
      enabled: true,
      priority: 10,
      trigger: "onContactCreated", // Se puede cambiar por trigger específico
      action: "sendSequenceEmail",
      values: {
        templateId: "LAST-001",
        subject: "{{contact.name}}, ¿algo salió mal? 💔",
        personalizations: {
          nombre: "{{contact.name}}",
          mensajePersonal: "Notamos que no has interactuado con nosotros...",
          ofertaEspecial: "{{getWinbackOffer()}}"
        }
      }
    },
    
    // Email 2: Súper oferta
    {
      id: "LASTCHANCE-EMAIL-02",
      name: "Email de Súper Oferta",
      description: "Oferta irresistible como último intento",
      enabled: true,
      priority: 20,
      trigger: "onTimeElapsed",
      timing: {
        delay: "48h"
      },
      action: "sendSequenceEmail",
      values: {
        templateId: "LAST-002",
        subject: "{{contact.name}}, 70% OFF - Nunca viste esto 🔥",
        personalizations: {
          nombre: "{{contact.name}}",
          superOferta: "70% de descuento exclusivo",
          justificacion: "Es nuestro regalo de despedida para ti"
        }
      }
    },
    
    // Email 3: Despedida elegante
    {
      id: "LASTCHANCE-EMAIL-03",
      name: "Email de Despedida",
      description: "Despedida elegante y opción de mantenerse",
      enabled: true,
      priority: 30,
      trigger: "onTimeElapsed",
      timing: {
        delay: "3d"
      },
      action: "sendSequenceEmail",
      values: {
        templateId: "LAST-003",
        subject: "Adiós {{contact.name}}, fue un placer conocerte ✨",
        personalizations: {
          nombre: "{{contact.name}}",
          mensajeDespedida: "Respetamos tu decisión de no continuar",
          opcionQuedar: "Si cambias de opinión, siempre tendrás las puertas abiertas"
        },
        tagsToAdd: ["Secuencia Finalizada", "No Convertido"],
        tagsToRemove: ["Secuencia Activa"]
      }
    }
  ]
};

// === EXPORTAR TODAS LAS SECUENCIAS ===
export const predefinedSequences: EmailSequence[] = [
  welcomeSeriesSequence,
  engagementBoosterSequence,
  urgencyConversionSequence,
  lastChanceSequence
];

// === FUNCIÓN HELPER PARA OBTENER SECUENCIA POR TIPO ===
export function getPredefinedSequence(type: string): EmailSequence | null {
  const sequenceMap: Record<string, EmailSequence> = {
    'welcome-series': welcomeSeriesSequence,
    'engagement-booster': engagementBoosterSequence,
    'urgency-conversion': urgencyConversionSequence,
    'last-chance': lastChanceSequence
  };
  
  return sequenceMap[type] || null;
} 