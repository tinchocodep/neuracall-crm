// Script de ejemplo para crear actividades de prueba
// Este script muestra cómo usar el hook useActivityLog para registrar actividades

import { useActivityLog } from '../hooks/useActivityLog';

// Ejemplo de uso en un componente
export function ExampleUsage() {
    const { logActivity } = useActivityLog();

    // Ejemplo 1: Registrar creación de cliente
    const handleClientCreated = async (clientId: string, clientName: string) => {
        await logActivity({
            activityType: 'client_created',
            title: `Cliente "${clientName}" creado`,
            description: 'Se ha creado un nuevo cliente en el sistema',
            clientId: clientId,
            relatedToType: 'client',
            relatedToId: clientId,
            metadata: {
                client_name: clientName,
                source: 'manual_creation'
            }
        });
    };

    // Ejemplo 2: Registrar actualización de cliente
    const handleClientUpdated = async (clientId: string, changes: Record<string, any>) => {
        await logActivity({
            activityType: 'client_updated',
            title: 'Cliente actualizado',
            description: 'Se han modificado los datos del cliente',
            clientId: clientId,
            relatedToType: 'client',
            relatedToId: clientId,
            metadata: {
                changes: changes
            }
        });
    };

    // Ejemplo 3: Registrar creación de oportunidad
    const handleOpportunityCreated = async (clientId: string, opportunityId: string, title: string, value: number) => {
        await logActivity({
            activityType: 'opportunity_created',
            title: `Nueva oportunidad: ${title}`,
            description: `Oportunidad creada con valor estimado de $${value.toLocaleString()}`,
            clientId: clientId,
            relatedToType: 'opportunity',
            relatedToId: opportunityId,
            metadata: {
                opportunity_title: title,
                value: value
            }
        });
    };

    // Ejemplo 4: Registrar cambio de etapa de oportunidad
    const handleOpportunityStageChanged = async (
        clientId: string,
        opportunityId: string,
        oldStage: string,
        newStage: string
    ) => {
        await logActivity({
            activityType: 'opportunity_stage_changed',
            title: 'Cambio de etapa en oportunidad',
            description: `La oportunidad pasó de "${oldStage}" a "${newStage}"`,
            clientId: clientId,
            relatedToType: 'opportunity',
            relatedToId: opportunityId,
            metadata: {
                old_stage: oldStage,
                new_stage: newStage
            }
        });
    };

    // Ejemplo 5: Registrar reunión programada
    const handleMeetingScheduled = async (clientId: string, eventId: string, title: string, date: string) => {
        await logActivity({
            activityType: 'meeting_scheduled',
            title: `Reunión programada: ${title}`,
            description: `Se ha agendado una reunión para el ${new Date(date).toLocaleDateString('es-AR')}`,
            clientId: clientId,
            relatedToType: 'event',
            relatedToId: eventId,
            metadata: {
                meeting_title: title,
                scheduled_date: date
            }
        });
    };

    // Ejemplo 6: Registrar nota agregada
    const handleNoteAdded = async (clientId: string, noteContent: string) => {
        await logActivity({
            activityType: 'note_added',
            title: 'Nueva nota agregada',
            description: noteContent.substring(0, 100) + (noteContent.length > 100 ? '...' : ''),
            clientId: clientId,
            metadata: {
                note_length: noteContent.length
            }
        });
    };

    // Ejemplo 7: Registrar llamada realizada
    const handleCallMade = async (clientId: string, duration: number, notes: string) => {
        await logActivity({
            activityType: 'call_made',
            title: 'Llamada realizada',
            description: notes,
            clientId: clientId,
            metadata: {
                duration_minutes: duration,
                call_type: 'outbound'
            }
        });
    };

    // Ejemplo 8: Registrar email enviado
    const handleEmailSent = async (clientId: string, subject: string, recipient: string) => {
        await logActivity({
            activityType: 'email_sent',
            title: `Email enviado: ${subject}`,
            description: `Email enviado a ${recipient}`,
            clientId: clientId,
            metadata: {
                subject: subject,
                recipient: recipient
            }
        });
    };

    return null; // Este es solo un componente de ejemplo
}

// Instrucciones de uso:
// 1. Importa el hook useActivityLog en tu componente
// 2. Llama a logActivity() después de realizar una acción importante
// 3. El sistema registrará automáticamente la actividad con el usuario y timestamp
// 4. Las actividades aparecerán en el timeline de la Ficha 360 del cliente
