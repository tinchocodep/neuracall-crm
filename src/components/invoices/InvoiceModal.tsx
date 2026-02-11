import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText, Building2, FolderKanban } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Invoice } from '../../types/crm';

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice?: Invoice;
    onSave: () => void;
}

export default function InvoiceModal({ isOpen, onClose, invoice, onSave }: InvoiceModalProps) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        project_id: '',
        client_id: '',
        invoice_number: '',
        invoice_type: 'installation' as 'installation' | 'monthly' | 'other',
        tax_type: 'with_vat' as 'with_vat' | 'without_vat',
        subtotal: 0,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: '',
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchProjects();
            fetchClients();
            if (invoice) {
                setFormData({
                    project_id: invoice.project_id,
                    client_id: invoice.client_id,
                    invoice_number: invoice.invoice_number || '',
                    invoice_type: invoice.invoice_type,
                    tax_type: invoice.tax_type,
                    subtotal: invoice.subtotal,
                    issue_date: invoice.issue_date,
                    due_date: invoice.due_date || '',
                    notes: invoice.notes || ''
                });
            }
        }
    }, [isOpen, invoice]);

    const fetchProjects = async () => {
        try {
            let query = supabase.from('projects').select('id, name').order('name');
            if (profile?.tenant_id) {
                query = query.eq('tenant_id', profile.tenant_id);
            }
            const { data } = await query;
            setProjects(data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const fetchClients = async () => {
        try {
            let query = supabase.from('clients').select('id, name').order('name');
            if (profile?.tenant_id) {
                query = query.eq('tenant_id', profile.tenant_id);
            }
            const { data } = await query;
            setClients(data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const calculateAmounts = () => {
        const subtotal = formData.subtotal;
        const vatRate = formData.tax_type === 'with_vat' ? 0.21 : 0;
        const vatAmount = subtotal * vatRate;
        const total = subtotal + vatAmount;
        return { subtotal, vatAmount, total };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const amounts = calculateAmounts();
            const invoiceData = {
                tenant_id: profile?.tenant_id,
                project_id: formData.project_id,
                client_id: formData.client_id,
                invoice_number: formData.invoice_number || null,
                invoice_type: formData.invoice_type,
                tax_type: formData.tax_type,
                subtotal: amounts.subtotal,
                vat_amount: amounts.vatAmount,
                total_amount: amounts.total,
                paid_amount: 0,
                pending_amount: amounts.total,
                payment_status: 'pending' as const,
                issue_date: formData.issue_date,
                due_date: formData.due_date || null,
                notes: formData.notes || null,
                created_by: profile?.id
            };

            if (invoice) {
                // Update existing invoice
                const { error } = await supabase
                    .from('invoices')
                    .update(invoiceData)
                    .eq('id', invoice.id);

                if (error) throw error;
            } else {
                // Create new invoice
                const { error } = await supabase
                    .from('invoices')
                    .insert([invoiceData]);

                if (error) throw error;
            }

            onSave();
            onClose();
            resetForm();
        } catch (error) {
            console.error('Error saving invoice:', error);
            alert('Error al guardar la factura');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            project_id: '',
            client_id: '',
            invoice_number: '',
            invoice_type: 'installation',
            tax_type: 'with_vat',
            subtotal: 0,
            issue_date: new Date().toISOString().split('T')[0],
            due_date: '',
            notes: ''
        });
    };

    const amounts = calculateAmounts();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-b border-slate-700 backdrop-blur-sm">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <FileText className="text-blue-400" size={28} />
                            {invoice ? 'Editar Factura' : 'Nueva Factura'}
                        </h2>
                        <p className="text-slate-400 mt-1">
                            {invoice ? 'Modifica los datos de la factura' : 'Completa los datos para crear una factura'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Client and Project */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Client */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                <Building2 size={16} className="text-blue-400" />
                                Cliente *
                            </label>
                            <select
                                required
                                value={formData.client_id}
                                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            >
                                <option value="">Seleccionar cliente</option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Project */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                <FolderKanban size={16} className="text-purple-400" />
                                Proyecto *
                            </label>
                            <select
                                required
                                value={formData.project_id}
                                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            >
                                <option value="">Seleccionar proyecto</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Invoice Number and Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Invoice Number */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Número de Factura
                            </label>
                            <input
                                type="text"
                                value={formData.invoice_number}
                                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                                placeholder="Ej: FC-001-00001234"
                                className="w-full bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>

                        {/* Invoice Type */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Tipo de Factura *
                            </label>
                            <select
                                required
                                value={formData.invoice_type}
                                onChange={(e) => setFormData({ ...formData, invoice_type: e.target.value as any })}
                                className="w-full bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            >
                                <option value="installation">Instalación</option>
                                <option value="monthly">Mensual</option>
                                <option value="other">Otro</option>
                            </select>
                        </div>
                    </div>

                    {/* Tax Type and Subtotal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tax Type */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Tipo de IVA *
                            </label>
                            <select
                                required
                                value={formData.tax_type}
                                onChange={(e) => setFormData({ ...formData, tax_type: e.target.value as any })}
                                className="w-full bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            >
                                <option value="with_vat">Con IVA (21%)</option>
                                <option value="without_vat">Sin IVA</option>
                            </select>
                        </div>

                        {/* Subtotal */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                <DollarSign size={16} className="text-emerald-400" />
                                Subtotal *
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.subtotal}
                                onChange={(e) => setFormData({ ...formData, subtotal: parseFloat(e.target.value) || 0 })}
                                placeholder="0.00"
                                className="w-full bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Amount Summary */}
                    <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-xl p-4">
                        <h3 className="text-sm font-medium text-slate-300 mb-3">Resumen de Montos</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Subtotal:</span>
                                <span className="text-white font-medium">
                                    ${amounts.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">IVA (21%):</span>
                                <span className="text-white font-medium">
                                    ${amounts.vatAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="border-t border-slate-700 pt-2 flex justify-between">
                                <span className="text-white font-semibold">Total:</span>
                                <span className="text-emerald-400 font-bold text-lg">
                                    ${amounts.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Issue Date */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                <Calendar size={16} className="text-blue-400" />
                                Fecha de Emisión *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.issue_date}
                                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>

                        {/* Due Date */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                <Calendar size={16} className="text-amber-400" />
                                Fecha de Vencimiento
                            </label>
                            <input
                                type="date"
                                value={formData.due_date}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Notas
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            placeholder="Notas adicionales sobre la factura..."
                            className="w-full bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all duration-200 active:scale-95"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-semibold shadow-xl shadow-blue-500/30 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Guardando...' : invoice ? 'Actualizar' : 'Crear Factura'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
