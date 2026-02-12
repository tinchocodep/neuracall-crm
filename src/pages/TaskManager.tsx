import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Plus, MoreVertical, Calendar, CheckSquare, MessageSquare, Paperclip } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Board {
    id: string;
    name: string;
    description: string;
    color: string;
    icon: string;
}

interface TaskList {
    id: string;
    name: string;
    position: number;
    color: string;
    cards: TaskCard[];
}

interface TaskCard {
    id: string;
    title: string;
    description: string | null;
    position: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date: string | null;
    tags: string[];
    assigned_to: string | null;
    subtasks_count?: number;
    subtasks_completed?: number;
    comments_count?: number;
    attachments_count?: number;
}

export default function TaskManager() {
    const { profile } = useAuth();
    const [, setBoards] = useState<Board[]>([]);
    const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
    const [lists, setLists] = useState<TaskList[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewCard, setShowNewCard] = useState<string | null>(null);
    const [newCardTitle, setNewCardTitle] = useState('');

    useEffect(() => {
        if (profile?.tenant_id) {
            fetchBoards();
        }
    }, [profile]);

    useEffect(() => {
        if (selectedBoard) {
            fetchLists();
        }
    }, [selectedBoard]);

    const fetchBoards = async () => {
        let query = supabase
            .from('boards')
            .select('*')
            .order('created_at', { ascending: false });

        // Solo filtrar por tenant_id si NO es cofounder
        if (profile?.tenant_id && profile?.role !== 'cofounder') {
            query = query.eq('tenant_id', profile.tenant_id);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching boards:', error);
            return;
        }

        setBoards(data || []);
        if (data && data.length > 0 && !selectedBoard) {
            setSelectedBoard(data[0]);
        }
        setLoading(false);
    };

    const fetchLists = async () => {
        if (!selectedBoard) return;

        const { data: listsData, error: listsError } = await supabase
            .from('task_lists')
            .select('*')
            .eq('board_id', selectedBoard.id)
            .order('position');

        if (listsError) {
            console.error('Error fetching lists:', listsError);
            return;
        }

        // Fetch cards for each list
        const listsWithCards = await Promise.all(
            (listsData || []).map(async (list) => {
                const { data: cardsData } = await supabase
                    .from('task_cards')
                    .select(`
            *,
            subtasks:card_subtasks(id, is_completed),
            comments:card_comments(id),
            attachments:card_attachments(id)
          `)
                    .eq('list_id', list.id)
                    .order('position');

                const cards = (cardsData || []).map((card: any) => ({
                    ...card,
                    subtasks_count: card.subtasks?.length || 0,
                    subtasks_completed: card.subtasks?.filter((s: any) => s.is_completed).length || 0,
                    comments_count: card.comments?.length || 0,
                    attachments_count: card.attachments?.length || 0,
                }));

                return {
                    ...list,
                    cards,
                };
            })
        );

        setLists(listsWithCards);
    };

    const handleDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const sourceListId = source.droppableId;
        const destListId = destination.droppableId;

        // Update local state
        const newLists = Array.from(lists);
        const sourceList = newLists.find(l => l.id === sourceListId);
        const destList = newLists.find(l => l.id === destListId);

        if (!sourceList || !destList) return;

        const [movedCard] = sourceList.cards.splice(source.index, 1);
        destList.cards.splice(destination.index, 0, movedCard);

        // Update positions
        sourceList.cards.forEach((card, index) => {
            card.position = index;
        });
        destList.cards.forEach((card, index) => {
            card.position = index;
        });

        setLists(newLists);

        // Update in database
        if (sourceListId !== destListId) {
            await supabase
                .from('task_cards')
                .update({ list_id: destListId, position: destination.index })
                .eq('id', draggableId);
        } else {
            await supabase
                .from('task_cards')
                .update({ position: destination.index })
                .eq('id', draggableId);
        }
    };

    const createCard = async (listId: string) => {
        if (!newCardTitle.trim()) return;

        const list = lists.find(l => l.id === listId);
        if (!list) return;

        const { error } = await supabase
            .from('task_cards')
            .insert({
                list_id: listId,
                title: newCardTitle,
                position: list.cards.length,
                created_by: profile?.id,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating card:', error);
            return;
        }

        setNewCardTitle('');
        setShowNewCard(null);
        fetchLists();
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-500';
            case 'high': return 'bg-orange-500';
            case 'medium': return 'bg-yellow-500';
            case 'low': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
            {/* Header */}
            <div className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-700/50 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            {selectedBoard?.icon} {selectedBoard?.name}
                        </h1>
                        {selectedBoard?.description && (
                            <p className="text-slate-400 text-sm">{selectedBoard.description}</p>
                        )}
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Nueva Lista
                    </button>
                </div>
            </div>

            {/* Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex gap-4 h-full">
                        {lists.map((list) => (
                            <div
                                key={list.id}
                                className="flex-shrink-0 w-80 flex flex-col bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50"
                            >
                                {/* List Header */}
                                <div className="p-4 border-b border-slate-700/50">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-white flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: list.color }}></div>
                                            {list.name}
                                            <span className="text-xs text-slate-400 ml-1">({list.cards.length})</span>
                                        </h3>
                                        <button className="text-slate-400 hover:text-white transition-colors">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Cards */}
                                <Droppable droppableId={list.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex-1 overflow-y-auto p-2 space-y-2 ${snapshot.isDraggingOver ? 'bg-slate-700/20' : ''
                                                }`}
                                        >
                                            {list.cards.map((card, index) => (
                                                <Draggable key={card.id} draggableId={card.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`bg-slate-900/80 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50 hover:border-blue-500/50 transition-all cursor-pointer ${snapshot.isDragging ? 'shadow-2xl shadow-blue-500/20 rotate-2' : ''
                                                                }`}
                                                        >
                                                            {/* Priority Indicator */}
                                                            <div className={`w-full h-1 rounded-full mb-2 ${getPriorityColor(card.priority)}`}></div>

                                                            {/* Title */}
                                                            <h4 className="text-white font-medium mb-2">{card.title}</h4>

                                                            {/* Tags */}
                                                            {card.tags && card.tags.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mb-2">
                                                                    {card.tags.map((tag, i) => (
                                                                        <span
                                                                            key={i}
                                                                            className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full"
                                                                        >
                                                                            {tag}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Meta Info */}
                                                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                                                {card.due_date && (
                                                                    <div className="flex items-center gap-1">
                                                                        <Calendar className="w-3 h-3" />
                                                                        {new Date(card.due_date).toLocaleDateString()}
                                                                    </div>
                                                                )}
                                                                {card.subtasks_count! > 0 && (
                                                                    <div className="flex items-center gap-1">
                                                                        <CheckSquare className="w-3 h-3" />
                                                                        {card.subtasks_completed}/{card.subtasks_count}
                                                                    </div>
                                                                )}
                                                                {card.comments_count! > 0 && (
                                                                    <div className="flex items-center gap-1">
                                                                        <MessageSquare className="w-3 h-3" />
                                                                        {card.comments_count}
                                                                    </div>
                                                                )}
                                                                {card.attachments_count! > 0 && (
                                                                    <div className="flex items-center gap-1">
                                                                        <Paperclip className="w-3 h-3" />
                                                                        {card.attachments_count}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}

                                            {/* Add Card Button */}
                                            {showNewCard === list.id ? (
                                                <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-700/50">
                                                    <input
                                                        type="text"
                                                        value={newCardTitle}
                                                        onChange={(e) => setNewCardTitle(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') createCard(list.id);
                                                            if (e.key === 'Escape') setShowNewCard(null);
                                                        }}
                                                        placeholder="Título de la tarea..."
                                                        className="w-full bg-transparent text-white outline-none mb-2"
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => createCard(list.id)}
                                                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                                                        >
                                                            Agregar
                                                        </button>
                                                        <button
                                                            onClick={() => setShowNewCard(null)}
                                                            className="px-3 py-1 bg-slate-700 text-white text-sm rounded hover:bg-slate-600 transition-colors"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setShowNewCard(list.id)}
                                                    className="w-full p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all flex items-center gap-2 justify-center"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Agregar tarea
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
                </DragDropContext>
            </div>
        </div>
    );
}
