
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
    const [loading, setLoading] = useState(true);
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
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) return;

        // Optimistic update
        const updatedOpportunities = opportunities.map(opp =>
            opp.id === draggableId
                ? { ...opp, status: destination.droppableId as any }
                : opp
        );
        setOpportunities(updatedOpportunities);

        // API update
        try {
            const { error } = await supabase
                .from('opportunities')
                .update({ status: destination.droppableId })
                .eq('id', draggableId);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating status:', error);
            // Revert on error
            fetchOpportunities();
        }
    };

    const getColumnOpportunities = (status: string) => {
        return opportunities.filter(opp => opp.status === status);
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
            {loading ? (
                <div className="flex-1 flex items-center justify-center text-slate-500">
                    Cargando oportunidades...
                </div>
            ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex-1 overflow-x-auto pb-4">
                        <div className="flex gap-4 min-w-[1800px] h-full">
                            {COLUMNS.map(column => {
                                const columnOpps = getColumnOpportunities(column.id);
                                const totalValue = getColumnTotal(column.id);

                                return (
                                    <div key={column.id} className="w-80 flex flex-col bg-slate-900/50 rounded-2xl border border-slate-800/50 backdrop-blur-sm h-full max-h-[calc(100vh-200px)]">
                                        {/* Column Header */}
                                        <div className="p-4 border-b border-slate-800/50 sticky top-0 bg-slate-900/90 backdrop-blur z-10 rounded-t-2xl">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold border ${column.color}`}>
                                                    {column.title.toUpperCase()}
                                                </span>
                                                <span className="text-slate-500 text-xs font-mono">{columnOpps.length}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-slate-300 font-medium">
                                                <DollarSign size={14} className="text-slate-500" />
                                                {totalValue.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </div>
                                        </div>

                                        {/* Droppable Area */}
                                        <Droppable droppableId={column.id}>
                                            {(provided, snapshot) => (
                                                <div
                                                    {...provided.droppableProps}
                                                    ref={provided.innerRef}
                                                    className={`flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar transition-colors ${snapshot.isDraggingOver ? 'bg-slate-800/30' : ''
                                                        }`}
                                                >
                                                    {columnOpps.map((opp, index) => (
                                                        <Draggable key={opp.id} draggableId={opp.id} index={index}>
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    onClick={() => handleEdit(opp)}
                                                                    className={`bg-slate-800 border border-slate-700/50 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all cursor-pointer group ${snapshot.isDragging ? 'shadow-2xl rotate-2 scale-105 z-50' : ''
                                                                        }`}
                                                                    style={provided.draggableProps.style}
                                                                >
                                                                    <h4 className="font-medium text-white mb-1 group-hover:text-blue-400 transition-colors line-clamp-2">
                                                                        {opp.title}
                                                                    </h4>
                                                                    <div className="text-sm text-slate-400 mb-3 flex items-center gap-1">
                                                                        <User size={12} />
                                                                        {(opp as any).client?.name || 'Cliente sin nombre'}
                                                                    </div>

                                                                    <div className="flex justify-between items-center text-xs">
                                                                        <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                                                                            <DollarSign size={12} />
                                                                            <span className="font-bold">{Number(opp.value).toLocaleString()}</span>
                                                                        </div>
                                                                        {opp.expected_close_date && (
                                                                            <div className="text-slate-500 flex items-center gap-1">
                                                                                <Calendar size={12} />
                                                                                {format(new Date(opp.expected_close_date), 'dd MMM', { locale: es })}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Probability Bar */}
                                                                    <div className="mt-3 h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full ${opp.probability > 70 ? 'bg-emerald-500' :
                                                                                opp.probability > 30 ? 'bg-yellow-500' : 'bg-red-500'
                                                                                }`}
                                                                            style={{ width: `${opp.probability}%` }}
                                                                        />
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
            )}

            <OpportunityModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchOpportunities}
                opportunity={editingOpportunity}
            />
        </div>
    );
}
