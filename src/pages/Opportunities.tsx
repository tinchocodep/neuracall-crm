
import { useState, useEffect } from 'react';
// @ts-ignore
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Plus, Search, Filter, DollarSign, Calendar, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Opportunity } from '../types/crm';
import OpportunityModal from '../components/opportunities/OpportunityModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Column definitions
const COLUMNS = [
    { id: 'new', title: 'Nuevo', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { id: 'qualification', title: 'Calificación', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    { id: 'visit', title: 'Visita', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    { id: 'proposal', title: 'Propuesta', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    { id: 'negotiation', title: 'Negociación', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
    { id: 'closed_won', title: 'Ganado', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
    { id: 'closed_lost', title: 'Perdido', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
];

export default function Opportunities() {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);

    useEffect(() => {
        fetchOpportunities();
    }, []);

    const fetchOpportunities = async () => {
        try {
            const { data, error } = await supabase
                .from('opportunities')
                .select('*, client:clients(name)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOpportunities(data || []);
        } catch (error) {
            console.error('Error fetching opportunities:', error);
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        // Dropped outside the list
        if (!destination) return;

        // No movement
        if (destination.droppableId === source.droppableId) return;

        // Update opportunity status
        const opportunityId = draggableId;
        const newStatus = destination.droppableId as Opportunity['status'];

        try {
            const { error } = await supabase
                .from('opportunities')
                .update({ status: newStatus })
                .eq('id', opportunityId);

            if (error) throw error;

            // Update local state
            setOpportunities(prev =>
                prev.map(opp =>
                    opp.id === opportunityId ? { ...opp, status: newStatus } : opp
                )
            );
        } catch (error) {
            console.error('Error updating opportunity:', error);
        }
    };

    const [viewFilter, setViewFilter] = useState<'all' | 'new'>('all');

    const getColumnOpportunities = (status: string) => {
        const filtered = opportunities.filter(opp => opp.status === status);
        // If viewing only prospects, only show 'new' column
        if (viewFilter === 'new' && status !== 'new') {
            return [];
        }
        return filtered;
    };

    const getColumnTotal = (status: string) => {
        return opportunities
            .filter(opp => opp.status === status)
            .reduce((sum, opp) => sum + (Number(opp.value) || 0), 0);
    };

    const handleEdit = (opp: Opportunity) => {
        setEditingOpportunity(opp);
        setIsModalOpen(true);
    };

    const openNewModal = () => {
        setEditingOpportunity(null);
        setIsModalOpen(true);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Pipeline de Ventas</h1>
                    <p className="text-slate-400">Gestiona tus oportunidades y cierres</p>
                </div>
                <div className="flex gap-3">
                    {/* Quick Filter Buttons */}
                    <div className="flex gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
                        <button
                            onClick={() => setViewFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewFilter === 'all'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setViewFilter('new')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewFilter === 'new'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Solo Prospectos
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500 w-64"
                        />
                    </div>
                    <button className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
                        <Filter size={20} />
                    </button>
                    <button
                        onClick={openNewModal}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={20} />
                        Nueva Oportunidad
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex-1 overflow-x-auto pb-4">
                    <div className="flex gap-4 h-full min-w-max">
                        {COLUMNS.map(column => {
                            const columnOpps = getColumnOpportunities(column.id);
                            const columnTotal = getColumnTotal(column.id);

                            // Hide empty columns when filtering for prospects only
                            if (viewFilter === 'new' && column.id !== 'new') {
                                return null;
                            }

                            return (
                                <div key={column.id} className="flex-shrink-0 w-80">
                                    <div className={`rounded-xl border p-3 mb-3 ${column.color}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold">{column.title}</h3>
                                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/10">
                                                {columnOpps.length}
                                            </span>
                                        </div>
                                        <p className="text-xs opacity-75">
                                            ${columnTotal.toLocaleString()}
                                        </p>
                                    </div>

                                    <Droppable droppableId={column.id}>
                                        {(provided: any, snapshot: any) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`space-y-3 min-h-[200px] p-2 rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-slate-800/50' : ''
                                                    }`}
                                            >
                                                {columnOpps.map((opp, index) => (
                                                    <Draggable key={opp.id} draggableId={opp.id} index={index}>
                                                        {(provided: any, snapshot: any) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                onClick={() => handleEdit(opp)}
                                                                className={`bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-blue-500/50 transition-all ${snapshot.isDragging ? 'shadow-2xl shadow-blue-500/20 scale-105' : ''
                                                                    }`}
                                                            >
                                                                <h4 className="font-medium text-white mb-2 line-clamp-2">
                                                                    {opp.title}
                                                                </h4>
                                                                <div className="space-y-2 text-sm text-slate-400">
                                                                    <div className="flex items-center gap-2">
                                                                        <User size={14} />
                                                                        <span className="truncate">{(opp as any).client?.name || 'Sin cliente'}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <DollarSign size={14} />
                                                                        <span>${Number(opp.value || 0).toLocaleString()}</span>
                                                                    </div>
                                                                    {opp.expected_close_date && (
                                                                        <div className="flex items-center gap-2">
                                                                            <Calendar size={14} />
                                                                            <span>
                                                                                {format(new Date(opp.expected_close_date), 'dd MMM yyyy', { locale: es })}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </DragDropContext>

            {/* Modal */}
            <OpportunityModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingOpportunity(null);
                }}
                opportunity={editingOpportunity}
                onSuccess={() => {
                    fetchOpportunities();
                    setIsModalOpen(false);
                    setEditingOpportunity(null);
                }}
            />
        </div>
    );
}
