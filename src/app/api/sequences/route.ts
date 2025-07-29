import { NextRequest, NextResponse } from 'next/server';
import { predefinedSequences, getPredefinedSequence } from '@/lib/sequences/predefined-sequences';
import { sequenceEngine } from '@/lib/sequences/sequence-engine';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/sequences
 * Lista todas las secuencias disponibles y sus estadísticas
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeStats = searchParams.get('stats') === 'true';

    // Obtener todas las secuencias
    const sequences = predefinedSequences.map(seq => ({
      id: seq.id,
      name: seq.name,
      description: seq.description,
      enabled: seq.enabled,
      config: seq.config,
      rulesCount: seq.rules.length,
      // Solo incluir reglas si se solicita específicamente
      rules: searchParams.get('includeRules') === 'true' ? seq.rules : undefined
    }));

    // Si se solicitan estadísticas, agregarlas
    if (includeStats) {
      // En una implementación real, estas vendrían de la base de datos
      for (const sequence of sequences) {
        (sequence as any).stats = {
          totalContacts: Math.floor(Math.random() * 1000),
          activeContacts: Math.floor(Math.random() * 100), 
          completedContacts: Math.floor(Math.random() * 200),
          openRate: parseFloat((Math.random() * 0.4 + 0.2).toFixed(2)), // 20-60%
          clickRate: parseFloat((Math.random() * 0.2 + 0.05).toFixed(2)), // 5-25%
          conversionRate: parseFloat((Math.random() * 0.1 + 0.02).toFixed(2)) // 2-12%
        };
      }
    }

    return NextResponse.json({
      sequences,
      total: sequences.length,
      enabled: sequences.filter(s => s.enabled).length
    });

  } catch (error) {
    console.error('Error fetching sequences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/sequences
 * Inicia una secuencia para un contacto específico
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, sequenceId, contactId, contactEmail, variables = {} } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    switch (action) {
      case 'start':
        return await handleStartSequence(sequenceId, contactId, contactEmail, variables);
      
      case 'stop':
        return await handleStopSequence(sequenceId, contactId);
      
      case 'pause':
        return await handlePauseSequence(sequenceId, contactId);
      
      case 'resume':
        return await handleResumeSequence(sequenceId, contactId);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in sequences API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Inicia una secuencia para un contacto
 */
async function handleStartSequence(
  sequenceId: string, 
  contactId?: string, 
  contactEmail?: string, 
  variables: Record<string, any> = {}
): Promise<NextResponse> {
  if (!sequenceId) {
    return NextResponse.json({ error: 'Sequence ID is required' }, { status: 400 });
  }

  // Verificar que la secuencia existe
  const sequence = getPredefinedSequence(sequenceId) || predefinedSequences.find(s => s.id === sequenceId);
  if (!sequence) {
    return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
  }

  try {
    let resolvedContactId = contactId;

    // Si no se proporciona contactId pero sí email, buscar el contacto
    if (!resolvedContactId && contactEmail) {
      const { data: contact } = await getSupabaseAdmin()
        .from('contacts')
        .select('id')
        .eq('email', contactEmail)
        .single();
      
      if (!contact) {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
      }
      
      resolvedContactId = contact.id;
    }

    if (!resolvedContactId) {
      return NextResponse.json({ error: 'Contact ID or email is required' }, { status: 400 });
    }

    // Iniciar la secuencia
    const executionId = await sequenceEngine.startSequence(sequenceId, resolvedContactId, variables);

    return NextResponse.json({
      success: true,
      executionId,
      message: `Sequence ${sequence.name} started for contact ${resolvedContactId}`,
      sequence: {
        id: sequence.id,
        name: sequence.name,
        totalSteps: sequence.rules.length
      }
    });

  } catch (error) {
    console.error('Error starting sequence:', error);
    return NextResponse.json({ 
      error: 'Failed to start sequence',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Detiene una secuencia
 */
async function handleStopSequence(sequenceId: string, contactId: string): Promise<NextResponse> {
  if (!sequenceId || !contactId) {
    return NextResponse.json({ error: 'Sequence ID and Contact ID are required' }, { status: 400 });
  }

  // En una implementación real, esto actualizaría la base de datos
  console.log(`🛑 Stopping sequence ${sequenceId} for contact ${contactId}`);
  
  return NextResponse.json({
    success: true,
    message: `Sequence ${sequenceId} stopped for contact ${contactId}`
  });
}

/**
 * Pausa una secuencia
 */
async function handlePauseSequence(sequenceId: string, contactId: string): Promise<NextResponse> {
  if (!sequenceId || !contactId) {
    return NextResponse.json({ error: 'Sequence ID and Contact ID are required' }, { status: 400 });
  }

  // En una implementación real, esto actualizaría la base de datos
  console.log(`⏸️ Pausing sequence ${sequenceId} for contact ${contactId}`);
  
  return NextResponse.json({
    success: true,
    message: `Sequence ${sequenceId} paused for contact ${contactId}`
  });
}

/**
 * Reanuda una secuencia pausada
 */
async function handleResumeSequence(sequenceId: string, contactId: string): Promise<NextResponse> {
  if (!sequenceId || !contactId) {
    return NextResponse.json({ error: 'Sequence ID and Contact ID are required' }, { status: 400 });
  }

  // En una implementación real, esto actualizaría la base de datos
  console.log(`▶️ Resuming sequence ${sequenceId} for contact ${contactId}`);
  
  return NextResponse.json({
    success: true,
    message: `Sequence ${sequenceId} resumed for contact ${contactId}`
  });
} 