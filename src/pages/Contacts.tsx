import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    Plus,
    Search,
    Phone,
    Mail,
    Briefcase,
    Building2,
    Users,
    Edit
} from 'lucide-react';
import type { Contact } from '../types/crm';
import ContactModal from '../components/contacts/ContactModal';

interface ContactWithClients extends Contact {
    clients?: { id: string; name: string }[];
}

export default function Contacts() {
    const { profile } = useAuth();
    const [contacts, setContacts] = useState<ContactWithClients[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<ContactWithClients | undefined>(undefined);

    useEffect(() => {
        fetchContacts();
    }, [profile]);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('contacts')
                .select(`
                    *,
                    contact_clients!inner(
                        client:clients(id, name)
                    )
                `)
                .order('created_at', { ascending: false });

            if (profile?.tenant_id) {
                query = query.eq('tenant_id', profile.tenant_id);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Transform data to group clients
            const transformedData = (data || []).reduce((acc: ContactWithClients[], contact: any) => {
                const existingContact = acc.find(c => c.id === contact.id);
                const clientData = contact.contact_clients?.client;

                if (existingContact && clientData) {
                    existingContact.clients = existingContact.clients || [];
                    if (!existingContact.clients.find(c => c.id === clientData.id)) {
                        existingContact.clients.push(clientData);
                    }
                } else {
                    acc.push({
                        ...contact,
                        clients: clientData ? [clientData] : []
                    });
                }
                return acc;
            }, []);

            setContacts(transformedData);
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewContact = () => {
        setSelectedContact(undefined);
        setModalOpen(true);
    };

    const handleEditContact = (contact: ContactWithClients, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedContact(contact);
        setModalOpen(true);
    };

    const filteredContacts = contacts.filter(contact => {
        const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
        const search = searchQuery.toLowerCase();
        return (
            fullName.includes(search) ||
            contact.email?.toLowerCase().includes(search) ||
            contact.position?.toLowerCase().includes(search) ||
            contact.clients?.some(c => c.name.toLowerCase().includes(search))
        );
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Contactos</h1>
                    <p className="text-slate-400 mt-1">
                        Gestiona los contactos de tus clientes y prospectos.
                    </p>
                </div>

                <button
                    onClick={handleNewContact}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all active:scale-95 w-full md:w-auto"
                >
                    <Plus size={20} />
                    <span>Nuevo Contacto</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-slate-900/50 backdrop-blur-md p-2 rounded-2xl border border-slate-800 flex items-center gap-2 max-w-md">
                <Search size={20} className="text-slate-500 ml-3 shrink-0" />
                <input
                    type="text"
                    placeholder="Buscar por nombre, email, cargo, empresa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-slate-200 placeholder-slate-500 w-full p-2 outline-none"
                />
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="h-48 bg-slate-800/50 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : filteredContacts.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users size={32} className="text-slate-600" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-300">No hay contactos</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">
                        {searchQuery ? 'No se encontraron resultados' : 'Comienza agregando tu primer contacto'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredContacts.map((contact) => (
                        <div
                            key={contact.id}
                            className="bg-slate-800 border border-slate-700/50 hover:border-blue-500/50 rounded-xl p-4 transition-all hover:bg-slate-800/80 hover:shadow-lg hover:shadow-blue-900/10 group cursor-pointer relative overflow-hidden flex flex-col justify-between h-full"
                        >
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => handleEditContact(contact, e)}
                                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                                    title="Editar"
                                >
                                    <Edit size={16} />
                                </button>
                            </div>

                            <div>
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm border border-white/10 shrink-0 shadow-sm">
                                        {contact.first_name?.[0]?.toUpperCase()}{contact.last_name?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="pr-8">
                                        <h3 className="font-semibold text-base text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                                            {contact.first_name} {contact.last_name}
                                        </h3>
                                        {contact.position && (
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                <Briefcase size={10} />
                                                <span className="line-clamp-1">{contact.position}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    {contact.email && (
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Mail size={14} className="text-slate-600 shrink-0" />
                                            <span className="truncate" title={contact.email}>{contact.email}</span>
                                        </div>
                                    )}
                                    {contact.phone && (
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Phone size={14} className="text-slate-600 shrink-0" />
                                            <span className="truncate">{contact.phone}</span>
                                        </div>
                                    )}
                                    {contact.clients && contact.clients.length > 0 && (
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Building2 size={14} className="text-slate-600 shrink-0" />
                                            <span className="truncate">
                                                {contact.clients.length === 1
                                                    ? contact.clients[0].name
                                                    : `${contact.clients.length} empresas`}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between">
                                {contact.is_primary && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                        Principal
                                    </span>
                                )}
                                <span className="text-[10px] text-slate-600 ml-auto">
                                    {new Date(contact.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Contact Modal */}
            <ContactModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setSelectedContact(undefined);
                }}
                onSuccess={() => {
                    fetchContacts();
                    setModalOpen(false);
                    setSelectedContact(undefined);
                }}
                contact={selectedContact}
            />
        </div>
    );
}
