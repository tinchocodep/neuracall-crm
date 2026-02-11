// Discord Integration Service
// Este servicio maneja la comunicación con Discord para chat y notificaciones

interface DiscordEmbed {
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{
        name: string;
        value: string;
        inline?: boolean;
    }>;
    footer?: {
        text: string;
        icon_url?: string;
    };
    timestamp?: string;
    author?: {
        name: string;
        icon_url?: string;
    };
}

class DiscordService {
    private webhookUrl: string;
    private guildId: string;
    private channelId: string;
    private voiceChannelId: string;

    constructor() {
        this.webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL || '';
        this.guildId = import.meta.env.VITE_DISCORD_GUILD_ID || '';
        this.channelId = import.meta.env.VITE_DISCORD_CHANNEL_ID || '';
        this.voiceChannelId = import.meta.env.VITE_DISCORD_VOICE_CHANNEL_ID || '';
    }

    /**
     * Verifica si Discord está configurado
     */
    isConfigured(): boolean {
        return !!this.webhookUrl;
    }

    /**
     * Envía un mensaje simple a Discord
     */
    async sendMessage(content: string, username?: string): Promise<boolean> {
        if (!this.isConfigured()) {
            console.warn('Discord webhook not configured');
            return false;
        }

        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content,
                    username: username || 'Neuracall CRM'
                })
            });

            return response.ok;
        } catch (error) {
            console.error('Error sending Discord message:', error);
            return false;
        }
    }

    /**
     * Envía un mensaje enriquecido (embed) a Discord
     */
    async sendEmbed(embed: DiscordEmbed, username?: string): Promise<boolean> {
        if (!this.isConfigured()) {
            console.warn('Discord webhook not configured');
            return false;
        }

        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username || 'Neuracall CRM',
                    embeds: [embed]
                })
            });

            return response.ok;
        } catch (error) {
            console.error('Error sending Discord embed:', error);
            return false;
        }
    }

    /**
     * Notifica sobre una nueva oportunidad
     */
    async notifyNewOpportunity(
        opportunityTitle: string,
        clientName: string,
        value: number,
        userName: string
    ): Promise<boolean> {
        return this.sendEmbed({
            title: '💰 Nueva Oportunidad Creada',
            description: `**${opportunityTitle}**`,
            color: 0x9333EA, // Purple
            fields: [
                {
                    name: 'Cliente',
                    value: clientName,
                    inline: true
                },
                {
                    name: 'Valor Estimado',
                    value: `$${value.toLocaleString()}`,
                    inline: true
                },
                {
                    name: 'Creado por',
                    value: userName,
                    inline: false
                }
            ],
            timestamp: new Date().toISOString(),
            footer: {
                text: 'Neuracall CRM'
            }
        });
    }

    /**
     * Notifica sobre un cambio de etapa en una oportunidad
     */
    async notifyOpportunityStageChange(
        opportunityTitle: string,
        clientName: string,
        oldStage: string,
        newStage: string,
        userName: string
    ): Promise<boolean> {
        const stageEmojis: Record<string, string> = {
            'prospecting': '🔍',
            'qualification': '📋',
            'proposal': '📄',
            'negotiation': '🤝',
            'closed_won': '✅',
            'closed_lost': '❌'
        };

        return this.sendEmbed({
            title: '📊 Cambio de Etapa en Oportunidad',
            description: `**${opportunityTitle}**`,
            color: 0x3B82F6, // Blue
            fields: [
                {
                    name: 'Cliente',
                    value: clientName,
                    inline: false
                },
                {
                    name: 'Etapa Anterior',
                    value: `${stageEmojis[oldStage] || '📌'} ${oldStage}`,
                    inline: true
                },
                {
                    name: 'Nueva Etapa',
                    value: `${stageEmojis[newStage] || '📌'} ${newStage}`,
                    inline: true
                },
                {
                    name: 'Actualizado por',
                    value: userName,
                    inline: false
                }
            ],
            timestamp: new Date().toISOString(),
            footer: {
                text: 'Neuracall CRM'
            }
        });
    }

    /**
     * Notifica sobre un nuevo cliente
     */
    async notifyNewClient(
        clientName: string,
        industry: string | null,
        userName: string
    ): Promise<boolean> {
        return this.sendEmbed({
            title: '🎉 Nuevo Cliente Registrado',
            description: `**${clientName}**`,
            color: 0x10B981, // Green
            fields: [
                ...(industry ? [{
                    name: 'Industria',
                    value: industry,
                    inline: true
                }] : []),
                {
                    name: 'Registrado por',
                    value: userName,
                    inline: true
                }
            ],
            timestamp: new Date().toISOString(),
            footer: {
                text: 'Neuracall CRM'
            }
        });
    }

    /**
     * Notifica sobre una reunión programada
     */
    async notifyMeetingScheduled(
        meetingTitle: string,
        clientName: string,
        date: string,
        userName: string
    ): Promise<boolean> {
        return this.sendEmbed({
            title: '📅 Reunión Programada',
            description: `**${meetingTitle}**`,
            color: 0x06B6D4, // Cyan
            fields: [
                {
                    name: 'Cliente',
                    value: clientName,
                    inline: true
                },
                {
                    name: 'Fecha',
                    value: new Date(date).toLocaleString('es-AR'),
                    inline: true
                },
                {
                    name: 'Programada por',
                    value: userName,
                    inline: false
                }
            ],
            timestamp: new Date().toISOString(),
            footer: {
                text: 'Neuracall CRM'
            }
        });
    }

    /**
     * Notifica sobre una tarea completada
     */
    async notifyTaskCompleted(
        taskTitle: string,
        clientName: string,
        userName: string
    ): Promise<boolean> {
        return this.sendEmbed({
            title: '✅ Tarea Completada',
            description: `**${taskTitle}**`,
            color: 0x22C55E, // Green
            fields: [
                {
                    name: 'Cliente',
                    value: clientName,
                    inline: true
                },
                {
                    name: 'Completada por',
                    value: userName,
                    inline: true
                }
            ],
            timestamp: new Date().toISOString(),
            footer: {
                text: 'Neuracall CRM'
            }
        });
    }

    /**
     * Genera un enlace de invitación al canal de voz
     */
    getVoiceChannelInvite(): string {
        if (!this.guildId || !this.voiceChannelId) {
            return '';
        }
        return `https://discord.com/channels/${this.guildId}/${this.voiceChannelId}`;
    }

    /**
     * Genera un enlace de invitación al canal de texto
     */
    getTextChannelInvite(): string {
        if (!this.guildId || !this.channelId) {
            return '';
        }
        return `https://discord.com/channels/${this.guildId}/${this.channelId}`;
    }

    /**
     * Envía un mensaje de chat del usuario
     */
    async sendChatMessage(
        userName: string,
        userAvatar: string | null,
        message: string
    ): Promise<boolean> {
        if (!this.isConfigured()) {
            console.warn('Discord webhook not configured');
            return false;
        }

        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: message,
                    username: userName,
                    avatar_url: userAvatar || undefined
                })
            });

            return response.ok;
        } catch (error) {
            console.error('Error sending chat message:', error);
            return false;
        }
    }
}

// Exportar una instancia singleton
export const discordService = new DiscordService();
