# 🚀 Email Workflow Intelligence

Un sistema automatizado que utiliza la API de Resend para generar workflows dinámicos e inteligentes para envíos de correos electrónicos, adaptando automáticamente el contenido según los eventos específicos detectados.

## ✨ Características Principales

- **🤖 Automatización Adaptativa**: Ajuste automático del contenido del correo (copy, asunto, pre-headers) según los eventos detectados
- **📊 Analytics en Tiempo Real**: Dashboard para monitorear comportamientos e interacciones
- **🎯 Personalización Dinámica**: Contenido adaptado según el contexto y tono específico
- **📈 Reportes Inteligentes**: Informes con recomendaciones basados en datos del comportamiento
- **⚡ Integración Sencilla**: Uso intuitivo de la API de Resend

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15 con App Router
- **UI**: Shadcn/UI + TailwindCSS
- **Base de Datos**: Supabase
- **Email Service**: Resend API
- **Deployment**: Vercel
- **Gráficos**: Recharts
- **Tipos**: TypeScript

## 📋 Eventos Soportados

- `email.sent` - Email enviado exitosamente
- `email.delivered` - Email entregado al servidor del destinatario
- `email.delivery_delayed` - Retraso temporal en la entrega
- `email.complained` - Marcado como spam por el destinatario
- `email.bounced` - Rechazo permanente del correo
- `email.opened` - Correo abierto por el destinatario
- `email.clicked` - Clic en enlace dentro del correo
- `email.failed` - Error en el envío del correo

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

\`\`\`bash
git clone <repository-url>
cd sdr
npm install
\`\`\`

### 2. Configurar Variables de Entorno

Copia el archivo de ejemplo y configura tus variables:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Configura las siguientes variables en `.env.local`:

\`\`\`env
# === RESEND CONFIGURATION ===
RESEND_API_KEY=re_dV3TouAN_DCjaa6YpjircxtxJ32kRKot1
RESEND_WEBHOOK_SECRET=your_webhook_secret_here

# === SUPABASE CONFIGURATION ===
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# === DEVELOPMENT SETTINGS ===
DEV_EMAIL_REDIRECT=fintdevla@gmail.com

# === VERCEL/DEPLOYMENT ===
NEXTAUTH_URL=http://localhost:3000

# === SECURITY ===
WEBHOOK_SECRET=change-this-in-production

# === ORGANIZATION SETTINGS (OPCIONAL) ===
ORG_5_RESEND_API_KEY=re_dV3TouAN_DCjaa6YpjircxtxJ32kRKot1
\`\`\`

> **🔑 TU API KEY YA ESTÁ CONFIGURADA**: El sistema usará automáticamente `re_dV3TouAN_DCjaa6YpjircxtxJ32kRKot1`

### 3. Configurar Webhook de Resend

Para que las **secuencias automáticas** funcionen, configura el webhook en tu dashboard de Resend:

1. Ve a [Resend Webhooks](https://resend.com/webhooks)
2. Agrega un nuevo webhook con esta URL:
   \`\`\`
   https://tu-dominio.vercel.app/api/webhooks/resend
   \`\`\`
3. Selecciona estos eventos:
   - `email.sent` - Email enviado
   - `email.delivered` - Email entregado
   - `email.opened` - Email abierto ⚡ **Dispara secuencias**
   - `email.clicked` - Email clickeado ⚡ **Dispara secuencias**
   - `email.bounced` - Email rebotado
   - `email.complained` - Marcado como spam
   - `email.failed` - Email falló

### 4. Configurar Supabase

Ejecuta el siguiente SQL en tu proyecto de Supabase para crear las tablas necesarias:

\`\`\`sql
-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create campaigns table
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  template_id UUID,
  user_id TEXT NOT NULL
);

-- Create email_templates table
CREATE TABLE email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  html_template TEXT NOT NULL,
  text_template TEXT,
  preheader_template TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id TEXT NOT NULL
);

-- Create contacts table
CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  custom_fields JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced', 'complained')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id TEXT NOT NULL
);

-- Create email_events table
CREATE TABLE email_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  email_id TEXT NOT NULL,
  contact_id UUID REFERENCES contacts(id),
  campaign_id UUID REFERENCES campaigns(id),
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id TEXT NOT NULL
);

-- Create email_logs table
CREATE TABLE email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  template_id UUID REFERENCES email_templates(id),
  contact_id UUID REFERENCES contacts(id) NOT NULL,
  email_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  user_id TEXT NOT NULL
);

-- Create automation_rules table
CREATE TABLE automation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) NOT NULL,
  trigger_event TEXT NOT NULL,
  conditions JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id TEXT NOT NULL
);

-- Add foreign key constraint for template_id in campaigns
ALTER TABLE campaigns ADD CONSTRAINT campaigns_template_id_fkey 
  FOREIGN KEY (template_id) REFERENCES email_templates(id);

-- Create indexes for better performance
CREATE INDEX idx_email_events_type ON email_events(type);
CREATE INDEX idx_email_events_email_id ON email_events(email_id);
CREATE INDEX idx_email_events_created_at ON email_events(created_at);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_status ON contacts(status);

-- Enable Row Level Security (opcional)
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
\`\`\`

### 4. Configurar Webhooks en Vercel

#### Configuración de Resend Webhooks

1. Ve a tu dashboard de Resend
2. Configura un webhook con la URL: `https://tu-dominio.vercel.app/api/webhooks/resend`
3. Selecciona todos los eventos de email que quieres escuchar:
   - `email.sent`
   - `email.delivered`
   - `email.bounced`
   - `email.complained`
   - `email.opened`
   - `email.clicked`
   - `email.failed`

#### Verificación de Webhooks

Puedes verificar la configuración visitando:
- `GET /api/webhooks` - Información de todos los webhooks
- `GET /webhooks` - Redirect automático a `/api/webhooks`
- `GET /docs/webhooks` - Alias para documentación
- `GET /api/webhooks/resend` - Información específica del webhook de Resend

#### Características de los Webhooks

- ✅ **Almacenamiento automático** de eventos en base de datos
- ✅ **Actualización de estado** de contactos en tiempo real
- ✅ **Procesamiento de reglas** de automatización
- ✅ **Adaptación inteligente** de contenido
- ✅ **Analytics en tiempo real**
- ✅ **Manejo robusto de errores**

### 5. Ejecutar en Desarrollo

\`\`\`bash
npm run dev
\`\`\`

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Deploy en Vercel

### Configuración Optimizada

El proyecto incluye `vercel.json` con configuraciones optimizadas:

#### 🚀 **Funciones Optimizadas**
- **Timeout de 30s** para todas las API routes
- **Manejo robusto** de webhooks de larga duración

#### 🌐 **CORS Configurado**
- **Headers automáticos** para webhooks
- **Soporte completo** para `resend-signature` y `x-webhook-secret`
- **Métodos permitidos**: GET, POST, PUT, DELETE, OPTIONS

#### 🔗 **URLs Amigables**
- `/webhooks/*` → redirige a `/api/webhooks/*`
- `/webhook/*` → redirige a `/api/webhooks/*` 
- `/docs/webhooks` → muestra info de webhooks

### Deploy Steps

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en el dashboard de Vercel
3. Haz deploy (automático con cada push)

\`\`\`bash
npm run build
\`\`\`

### URLs Disponibles Después del Deploy

\`\`\`bash
# Webhooks
https://tu-proyecto.vercel.app/api/webhooks/resend
https://tu-proyecto.vercel.app/webhooks/resend  # redirect automático

# Documentación
https://tu-proyecto.vercel.app/api/webhooks
https://tu-proyecto.vercel.app/docs/webhooks   # alias
\`\`\`

## 🎯 Uso del Sistema

### 1. Crear Templates de Email

Los templates soportan variables usando la sintaxis `{{variable_name}}`:

\`\`\`html
<h1>Hola {{first_name}}!</h1>
<p>Gracias por tu interés en {{product_name}}.</p>
\`\`\`

### 2. Configurar Campañas

Crea campañas que incluyan:
- Nombre y descripción
- Template asociado
- Reglas de automatización

### 3. Reglas de Automatización

Las reglas se disparan automáticamente basándose en eventos:

\`\`\`javascript
{
  "trigger_event": "email.opened",
  "conditions": [
    {
      "field": "subject",
      "operator": "contains",
      "value": "Newsletter"
    }
  ],
  "actions": [
    {
      "type": "send_email",
      "config": {
        "template_id": "uuid",
        "delay_hours": 24
      }
    }
  ]
}
\`\`\`

## 🤖 Sistema de IA Inteligente

### Adaptación Automática de Contenido

El sistema adapta automáticamente el contenido basándose en los eventos:

- **Email Abierto**: Añade urgencia y llamadas a la acción más compelling
- **Clic Registrado**: Envía contenido de agradecimiento y siguientes pasos
- **Email Rebotado**: Crea contenido para métodos alternativos de contacto
- **Marcado como Spam**: Envía mensaje de disculpa y confirma unsubscribe

### 🔥 Nuevas Características Avanzadas

- **Interpolación Inteligente**: Soporte para expresiones condicionales en templates
  ```html
  <p>{status === 'active' ? 'Usuario activo' : 'Usuario inactivo'}</p>
  ```
- **Branding por Organización**: Headers y footers personalizados por cliente
- **Validación Robusta**: Validación automática de formatos de email
- **Redirección en Desarrollo**: Emails seguros durante testing
- **Headers Personalizados**: Tracking avanzado con metadata
- **Logs Detallados**: Registro completo de todas las operaciones

### Ejemplos de Adaptación

\`\`\`javascript
// Evento: email.opened
// Adaptación: Subject line con urgencia
"🔥 Still interested? Original Subject"

// Evento: email.clicked  
// Adaptación: Mensaje de agradecimiento
"Thanks for your interest! Next steps inside"
\`\`\`

## 📊 API Endpoints

### Campañas
- `GET /api/campaigns` - Listar campañas
- `POST /api/campaigns` - Crear campaña
- `PUT /api/campaigns/[id]` - Actualizar campaña
- `DELETE /api/campaigns/[id]` - Eliminar campaña

### Emails
- `POST /api/emails/send` - Enviar email
  - Tipos: `single`, `template`, `campaign`

### Webhooks
- `GET /api/webhooks` - Información de todos los webhooks
- `GET /api/webhooks/resend` - Información del webhook de Resend
- `POST /api/webhooks/resend` - Webhook de Resend para eventos de email

#### Debugging de Webhooks en Vercel

Para debuggear webhooks en Vercel:

1. **Logs en tiempo real**:
   ```bash
   vercel logs --follow
   ```

2. **Verificar configuración**:
   ```bash
   curl https://tu-dominio.vercel.app/api/webhooks
   ```

3. **Test de webhook de Resend**:
   ```bash
   curl https://tu-dominio.vercel.app/api/webhooks/resend
   ```

4. **Monitorear en Vercel Dashboard**:
   - Ve a tu proyecto en Vercel
   - Sección "Functions" → "View Function Logs"
   - Filtra por `/api/webhooks/resend`

## 🔧 Desarrollo

### Estructura del Proyecto

\`\`\`
src/
├── app/                    # App Router de Next.js
│   ├── api/               # API Routes
│   ├── page.tsx           # Dashboard principal
├── components/            # Componentes React
│   ├── ui/               # Componentes de Shadcn/UI
│   └── dashboard/        # Componentes del dashboard
├── lib/                  # Utilidades y configuración
│   ├── supabase.ts       # Cliente de Supabase
│   ├── resend.ts         # Cliente de Resend
│   └── automation.ts     # Sistema de automatización
└── types/                # Tipos de TypeScript
    ├── email.ts          # Tipos de email
    └── database.ts       # Tipos de base de datos
\`\`\`

### Comandos Útiles

\`\`\`bash
npm run dev          # Desarrollo
npm run build        # Build para producción
npm run start        # Ejecutar build
npm run lint         # Linting
\`\`\`

## 🧪 Prueba tu Configuración

### **Verificar API Key de Resend**

Una vez configurado, prueba que tu API key funciona:

1. **Crear un contacto de prueba:**
   \`\`\`bash
   curl -X POST http://localhost:3000/api/sequences \\
     -H "Content-Type: application/json" \\
     -d '{
       "action": "start",
       "sequenceId": "SEQ-WELCOME-001", 
       "contactEmail": "tu-email@gmail.com",
       "variables": {
         "nombre": "Prueba"
       }
     }'
   \`\`\`

2. **Verificar secuencias disponibles:**
   \`\`\`bash
   curl http://localhost:3000/api/sequences?stats=true
   \`\`\`

3. **Probar webhook (simulado):**
   \`\`\`bash
   curl -X POST http://localhost:3000/api/webhooks/resend \\
     -H "Content-Type: application/json" \\
     -H "resend-signature: test" \\
     -d '{
       "type": "email.opened",
       "data": {
         "email_id": "test-123",
         "to": ["tu-email@gmail.com"],
         "subject": "Test Email"
       }
     }'
   \`\`\`

### **Verificar Logs**

Revisa la consola para ver logs como:
\`\`\`
🔄 SequenceEngine: Processing event email.opened
🚀 Starting sequence SEQ-WELCOME-001 for contact contact-123
📧 Sequence email sent: email-456
🏷️ Tags updated for contact contact-123: +["Usuario Interesado"]
\`\`\`

### **Dashboard de Resend**

Verifica en tu [dashboard de Resend](https://resend.com/emails) que los emails se están enviando correctamente.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit tus cambios: `git commit -m 'Añadir nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación
2. Busca en los issues existentes
3. Crea un nuevo issue con detalles específicos

---

**Hecho con ❤️ para optimizar tus campañas de email marketing**
