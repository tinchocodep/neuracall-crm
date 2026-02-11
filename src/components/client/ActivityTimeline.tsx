import { useState, useEffect } from 'react';
import { Clock, User, Mail, Phone, Calendar, FileText, TrendingUp, CheckCircle, MessageSquare, Upload, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Activity {
    id: string;
    activity_type: string;
    title: string;
    description: string | null;
    metadata: any;
    created_at: string;
    created_by: string | null;
    user_name: string | null;
    user_avatar: string | null;
}

interface ActivityTimelineProps {
    clientId: string;
}

export default function ActivityTimeline({ clientId }: ActivityTimelineProps) {
    const { profile } = useAuth();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (clientId && profile?.tenant_id) {
            fetchActivities();
        }
    }, [clientId, profile]);

    const fetchActivities = async () => {
        if (!profile?.tenant_id) return;

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('activity_log')
                .select(`
                    *,
                    users:created_by (
                        full_name,
                        avatar_url
                    )
                `)
                .eq('tenant_id', profile.tenant_id)
                .eq('client_id', clientId)
                .order('created_at', { ascending: false })
                .limit(100);

            if (fetchError) throw fetchError;

            const formattedActivities = (data || []).map((activity: any) => ({
                id: activity.id,
                activity_type: activity.activity_type,
                title: activity.title,
                description: activity.description,
                metadata: activity.metadata || {},
                created_at: activity.created_at,
                created_by: activity.created_by,
                user_name: activity.users?.full_name || null,
                user_avatar: activity.users?.avatar_url || null
            }));

            setActivities(formattedActivities);
        } catch (err: any) {
            console.error('Error fetching activities:', err);
            setError('Error al cargar el historial de actividades');
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (type: string) => {
        const icons: Record<string, any> = {
            'client_created': User,
            'client_updated': User,
            'contact_created': User,
            'contact_updated': User,
            'opportunity_created': TrendingUp,
            'opportunity_updated': TrendingUp,
            'opportunity_stage_changed': TrendingUp,
            'meeting_scheduled': Calendar,
            'meeting_completed': CheckCircle,
            'note_added': MessageSquare,
            'email_sent': Mail,
            'call_made': Phone,
            'task_created': FileText,
            'task_completed': CheckCircle,
            'file_uploaded': Upload,
            'status_changed': AlertCircle,
            'other': Clock
        };
        return icons[type] || Clock;
    };

    const getActivityColor = (type: string) => {
        const colors: Record<string, string> = {
            'client_created': 'text-emerald-400 bg-emerald-500/10',
            'client_updated': 'text-blue-400 bg-blue-500/10',
            'contact_created': 'text-emerald-400 bg-emerald-500/10',
            'contact_updated': 'text-blue-400 bg-blue-500/10',
            'opportunity_created': 'text-purple-400 bg-purple-500/10',
            'opportunity_updated': 'text-purple-400 bg-purple-500/10',
            'opportunity_stage_changed': 'text-orange-400 bg-orange-500/10',
            'meeting_scheduled': 'text-cyan-400 bg-cyan-500/10',
            'meeting_completed': 'text-emerald-400 bg-emerald-500/10',
            'note_added': 'text-yellow-400 bg-yellow-500/10',
            'email_sent': 'text-blue-400 bg-blue-500/10',
            'call_made': 'text-green-400 bg-green-500/10',
            'task_created': 'text-indigo-400 bg-indigo-500/10',
            'task_completed': 'text-emerald-400 bg-emerald-500/10',
            'file_uploaded': 'text-pink-400 bg-pink-500/10',
            'status_changed': 'text-orange-400 bg-orange-500/10',
            'other': 'text-slate-400 bg-slate-500/10'
        };
        return colors[type] || 'text-slate-400 bg-slate-500/10';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const minutes = Math.floor(diffInHours * 60);
            return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
        } else if (diffInHours < 24) {
            const hours = Math.floor(diffInHours);
            return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
        } else if (diffInHours < 48) {
            return 'Ayer';
        } else {
            return date.toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'short',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                {error}
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-12">
                <Clock size={48} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">No hay actividades registradas</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {activities.map((activity, index) => {
                const Icon = getActivityIcon(activity.activity_type);
                const colorClass = getActivityColor(activity.activity_type);

                return (
                    <div key={activity.id} className="relative">
                        {/* Timeline line */}
                        {index < activities.length - 1 && (
                            <div className="absolute left-6 top-14 bottom-0 w-px bg-slate-800"></div>
                        )}

                        {/* Activity card */}
                        <div className="flex gap-4">
                            {/* Icon */}
                            <div className={`flex-shrink-0 w-12 h-12 rounded-full ${colorClass} flex items-center justify-center relative z-10`}>
                                <Icon size={20} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-white mb-1">{activity.title}</h4>
                                        {activity.description && (
                                            <p className="text-sm text-slate-400">{activity.description}</p>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-500 whitespace-nowrap">
                                        {formatDate(activity.created_at)}
                                    </span>
                                </div>

                                {/* Metadata */}
                                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                    <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            {Object.entries(activity.metadata).map(([key, value]) => (
                                                <div key={key}>
                                                    <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                                                    <span className="ml-2 text-slate-300">{String(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* User info */}
                                {activity.user_name && (
                                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                                        {activity.user_avatar ? (
                                            <img
                                                src={activity.user_avatar}
                                                alt={activity.user_name}
                                                className="w-5 h-5 rounded-full"
                                            />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs">
                                                {activity.user_name[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        <span>Por {activity.user_name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
