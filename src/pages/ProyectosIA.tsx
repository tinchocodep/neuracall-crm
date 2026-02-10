import { useState } from 'react';
import { Brain } from 'lucide-react';
import { useProjects } from '../hooks/useTimeTracking';
import { TimeTracker } from '../components/TimeTracker';
import { cn } from '../utils/cn';

export default function ProyectosIA() {
    const { projects, loading } = useProjects();
    const [selectedProject, setSelectedProject] = useState<string | null>(null);

    const getStatusColor = (status: string) => {
        const colors = {
            planning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            testing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            deployed: 'bg-green-500/10 text-green-400 border-green-500/20',
            completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            on_hold: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        };
        return colors[status as keyof typeof colors] || colors.planning;
    };

    const getStatusLabel = (status: string) => {
        const labels = {
            planning: 'Planificación',
            in_progress: 'En Desarrollo',
            testing: 'Testing',
            deployed: 'Deployado',
            completed: 'Completado',
            on_hold: 'En Pausa',
        };
        return labels[status as keyof typeof labels] || status;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Brain className="w-8 h-8 text-blue-400" />
                        Proyectos IA
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona tus proyectos de inteligencia artificial
                    </p>
                </div>
                <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium transition-all shadow-lg shadow-blue-500/25">
                    + Nuevo Proyecto
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Projects List */}
                <div className="lg:col-span-2 space-y-4">
                    {projects.length === 0 ? (
                        <div className="p-12 rounded-2xl bg-card/50 border border-border/30 text-center">
                            <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">No hay proyectos</h3>
                            <p className="text-muted-foreground">Crea tu primer proyecto de IA</p>
                        </div>
                    ) : (
                        projects.map((project) => (
                            <div
                                key={project.id}
                                className={cn(
                                    "p-6 rounded-2xl bg-card/50 border transition-all cursor-pointer",
                                    selectedProject === project.id
                                        ? "border-primary/50 bg-card/80 shadow-lg shadow-primary/10"
                                        : "border-border/30 hover:border-border/50 hover:bg-card/70"
                                )}
                                onClick={() => setSelectedProject(project.id)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-foreground">{project.title}</h3>
                                            <span className={cn("px-3 py-1 rounded-full text-xs font-medium border", getStatusColor(project.status))}>
                                                {getStatusLabel(project.status)}
                                            </span>
                                        </div>
                                        {project.description && (
                                            <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Tech Stack */}
                                {project.tech_stack && project.tech_stack.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {project.tech_stack.map((tech, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-1 rounded-md bg-secondary/50 text-xs font-medium text-secondary-foreground"
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/30">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Presupuesto</p>
                                        <p className="font-semibold text-foreground">
                                            {project.budget ? `$${project.budget.toLocaleString()}` : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Horas Est.</p>
                                        <p className="font-semibold text-foreground">
                                            {project.estimated_hours || 'N/A'}h
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Horas Real</p>
                                        <p className="font-semibold text-blue-400">
                                            {project.actual_hours || 0}h
                                        </p>
                                    </div>
                                </div>

                                {/* Dates */}
                                {(project.start_date || project.end_date) && (
                                    <div className="flex gap-4 mt-4 pt-4 border-t border-border/30">
                                        {project.start_date && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Inicio</p>
                                                <p className="text-sm font-medium text-foreground">
                                                    {new Date(project.start_date).toLocaleDateString('es-AR')}
                                                </p>
                                            </div>
                                        )}
                                        {project.end_date && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Fin</p>
                                                <p className="text-sm font-medium text-foreground">
                                                    {new Date(project.end_date).toLocaleDateString('es-AR')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Time Tracker Sidebar */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6">
                        <TimeTracker projectId={selectedProject || undefined} />
                    </div>
                </div>
            </div>
        </div>
    );
}
