import { useState, useEffect } from 'react';
import { Play, Square, Clock } from 'lucide-react';
import { useTimeTracking, useProjects } from '../hooks/useTimeTracking';
import { cn } from '../utils/cn';

export function TimeTracker({ projectId }: { projectId?: string }) {
    const { activeEntry, entries, startTimer, stopTimer, getTotalHours } = useTimeTracking(projectId);
    const { projects } = useProjects();
    const [selectedProject, setSelectedProject] = useState(projectId || '');
    const [description, setDescription] = useState('');
    const [elapsedTime, setElapsedTime] = useState(0);

    // Update elapsed time every second when timer is active
    useEffect(() => {
        if (!activeEntry) {
            setElapsedTime(0);
            return;
        }

        const interval = setInterval(() => {
            const start = new Date(activeEntry.start_time).getTime();
            const now = Date.now();
            const elapsed = Math.floor((now - start) / 1000);
            setElapsedTime(elapsed);
        }, 1000);

        return () => clearInterval(interval);
    }, [activeEntry]);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const handleStart = async () => {
        if (!selectedProject) return;
        try {
            await startTimer(selectedProject, description);
            setDescription('');
        } catch (error) {
            console.error('Failed to start timer:', error);
        }
    };

    const handleStop = async () => {
        try {
            await stopTimer();
        } catch (error) {
            console.error('Failed to stop timer:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Active Timer */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                            <Clock className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Time Tracker</h3>
                            <p className="text-sm text-muted-foreground">
                                Total: {getTotalHours().toFixed(1)}h logged
                            </p>
                        </div>
                    </div>
                    {activeEntry && (
                        <div className="text-3xl font-mono font-bold text-blue-400">
                            {formatTime(elapsedTime)}
                        </div>
                    )}
                </div>

                {!activeEntry ? (
                    <div className="space-y-3">
                        <select
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-background/50 border border-border/50 text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                            disabled={!!projectId}
                        >
                            <option value="">Seleccionar proyecto...</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>

                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="¿En qué estás trabajando?"
                            className="w-full px-4 py-2 rounded-lg bg-background/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                        />

                        <button
                            onClick={handleStart}
                            disabled={!selectedProject}
                            className={cn(
                                "w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
                                selectedProject
                                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                        >
                            <Play className="w-4 h-4" />
                            Iniciar Timer
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                            <p className="text-sm text-muted-foreground mb-1">Trabajando en:</p>
                            <p className="font-medium text-foreground">
                                {projects.find(p => p.id === activeEntry.ai_project_id)?.name || 'Proyecto'}
                            </p>
                            {activeEntry.description && (
                                <p className="text-sm text-muted-foreground mt-2">{activeEntry.description}</p>
                            )}
                        </div>

                        <button
                            onClick={handleStop}
                            className="w-full py-3 rounded-lg font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Square className="w-4 h-4" />
                            Detener Timer
                        </button>
                    </div>
                )}
            </div>

            {/* Recent Entries */}
            <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Actividad Reciente</h4>
                <div className="space-y-2">
                    {entries.slice(0, 5).map((entry) => (
                        <div
                            key={entry.id}
                            className="p-4 rounded-lg bg-card/50 border border-border/30 hover:bg-card/70 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="font-medium text-foreground text-sm">
                                        {projects.find(p => p.id === entry.ai_project_id)?.name || 'Proyecto'}
                                    </p>
                                    {entry.description && (
                                        <p className="text-xs text-muted-foreground mt-1">{entry.description}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {new Date(entry.start_time).toLocaleDateString('es-AR', {
                                            day: '2-digit',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-semibold text-blue-400">
                                        {entry.duration_minutes ? formatDuration(entry.duration_minutes) : 'En curso...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
