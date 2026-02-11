import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Phone, X, Minimize2, Maximize2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { discordService } from '../../services/discord';

interface ChatMessage {
    id: string;
    userName: string;
    userAvatar: string | null;
    message: string;
    timestamp: Date;
    isOwn: boolean;
}

export default function DiscordChat() {
    const { user, profile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isConfigured = discordService.isConfigured();
    const voiceChannelUrl = discordService.getVoiceChannelInvite();
    const textChannelUrl = discordService.getTextChannelInvite();

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !user || !profile) return;

        setSending(true);

        try {
            // Agregar mensaje localmente
            const newMessage: ChatMessage = {
                id: Date.now().toString(),
                userName: profile.full_name || user.email || 'Usuario',
                userAvatar: profile.avatar_url || null,
                message: message.trim(),
                timestamp: new Date(),
                isOwn: true
            };

            setMessages(prev => [...prev, newMessage]);
            setMessage('');

            // Enviar a Discord
            const success = await discordService.sendChatMessage(
                newMessage.userName,
                newMessage.userAvatar,
                newMessage.message
            );

            if (!success) {
                console.error('Failed to send message to Discord');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleJoinVoice = () => {
        if (voiceChannelUrl) {
            window.open(voiceChannelUrl, '_blank');
        }
    };

    const handleOpenTextChannel = () => {
        if (textChannelUrl) {
            window.open(textChannelUrl, '_blank');
        }
    };

    if (!isConfigured) {
        return null; // No mostrar si Discord no está configurado
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110"
                title="Abrir chat"
            >
                <MessageSquare size={24} />
            </button>
        );
    }

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl transition-all ${isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-gradient-to-r from-purple-600/10 to-indigo-600/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600/20 rounded-lg">
                        <MessageSquare size={20} className="text-purple-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Chat del Equipo</h3>
                        <p className="text-xs text-slate-400">Conectado a Discord</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {voiceChannelUrl && (
                        <button
                            onClick={handleJoinVoice}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-emerald-400 hover:text-emerald-300"
                            title="Unirse al canal de voz"
                        >
                            <Phone size={18} />
                        </button>
                    )}
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                        title={isMinimized ? 'Maximizar' : 'Minimizar'}
                    >
                        {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                        title="Cerrar"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(600px-140px)]">
                        {messages.length === 0 ? (
                            <div className="text-center py-12">
                                <MessageSquare size={48} className="mx-auto text-slate-600 mb-4" />
                                <p className="text-slate-400 mb-2">No hay mensajes aún</p>
                                <p className="text-sm text-slate-500">
                                    Envía un mensaje para comenzar la conversación
                                </p>
                                {textChannelUrl && (
                                    <button
                                        onClick={handleOpenTextChannel}
                                        className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm transition-colors"
                                    >
                                        Abrir en Discord
                                    </button>
                                )}
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 ${msg.isOwn ? 'flex-row-reverse' : ''}`}
                                >
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        {msg.userAvatar ? (
                                            <img
                                                src={msg.userAvatar}
                                                alt={msg.userName}
                                                className="w-8 h-8 rounded-full"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                                                {msg.userName[0]?.toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Message */}
                                    <div className={`flex-1 ${msg.isOwn ? 'text-right' : ''}`}>
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className={`text-sm font-medium text-white ${msg.isOwn ? 'order-2' : ''}`}>
                                                {msg.userName}
                                            </span>
                                            <span className={`text-xs text-slate-500 ${msg.isOwn ? 'order-1' : ''}`}>
                                                {msg.timestamp.toLocaleTimeString('es-AR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <div
                                            className={`inline-block px-4 py-2 rounded-lg ${msg.isOwn
                                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                                                : 'bg-slate-800 text-slate-200'
                                                }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap break-words">
                                                {msg.message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Escribe un mensaje..."
                                disabled={sending}
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={!message.trim() || sending}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-lg shadow-purple-500/30 disabled:shadow-none"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Los mensajes se envían a Discord y son visibles para todo el equipo
                        </p>
                    </form>
                </>
            )}
        </div>
    );
}
